using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services
{
    public class LoanReminderService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LoanReminderService> _logger;
        private readonly string _owner = $"reminder-{Environment.MachineName}-{Guid.NewGuid():N}";

        public LoanReminderService(
            IServiceScopeFactory scopeFactory,
            ILogger<LoanReminderService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                var nextRun = GetNextRunTime(now);
                var delay = nextRun - now;

                _logger.LogInformation(
                    "LoanReminderService próxima ejecución: {NextRun:yyyy-MM-dd HH:mm:ss} UTC",
                    nextRun);

                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested) break;

                var lockAcquired = false;
                IServiceScope? lockScope = null;
                try
                {
                    lockScope = _scopeFactory.CreateScope();
                    var distributedLock = lockScope.ServiceProvider.GetRequiredService<IDistributedJobLock>();
                    lockAcquired = await distributedLock.TryAcquireAsync("loan-reminders", _owner, TimeSpan.FromMinutes(10), stoppingToken);
                    if (!lockAcquired)
                    {
                        _logger.LogWarning("LoanReminderService omitió una ejecución solapada.");
                        continue;
                    }
                    await ProcessRemindersAsync(stoppingToken);
                    await distributedLock.ReleaseAsync("loan-reminders", _owner, stoppingToken);
                }
                catch (Exception ex)
                {
                    if (ex is OperationCanceledException && stoppingToken.IsCancellationRequested) break;
                    _logger.LogError(ex, "Error al procesar recordatorios de préstamos.");
                }
                finally
                {
                    lockScope?.Dispose();
                }
            }
        }

        private async Task ProcessRemindersAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var today = DateTime.UtcNow.Date;
            var reminderWindow = today.AddDays(3);

            var installmentsDueSoon = await context.Installments
                .Where(i => i.Estado != EstadoInstallment.Pagado
                    && i.FechaPago.Date == reminderWindow
                    && (i.Loan.Estado == EstadoPrestamo.Activo ||
                        i.Loan.Estado == EstadoPrestamo.Mora ||
                        i.Loan.Estado == EstadoPrestamo.Vencido))
                .Include(i => i.Loan)
                    .ThenInclude(l => l.Client)
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                "Encontradas {Count} cuotas con vencimiento el {Date}.",
                installmentsDueSoon.Count,
                reminderWindow.ToString("dd/MM/yyyy"));

            foreach (var installment in installmentsDueSoon)
            {
                var loan = installment.Loan;
                var client = loan.Client;
                if (client == null || string.IsNullOrWhiteSpace(client.Email))
                {
                    _logger.LogWarning(
                        "Préstamo {LoanId} sin cliente o sin email, se omite recordatorio.",
                        loan.Id);
                    continue;
                }

                var notificationKey = $"loan-payment-reminder:{loan.Id:N}:{installment.Numero}";
                var alreadySent = await context.MessageLogs.AnyAsync(log =>
                    log.Tipo == TipoNotificacion.Email &&
                    log.Estado == EstadoMensaje.Enviado &&
                    log.Mensaje.Contains(notificationKey), cancellationToken);
                if (alreadySent) continue;

                var email = LoanEmailBuilder.UpcomingPayment(
                    loan,
                    client,
                    installment,
                    notificationService.ClientPortalUrl);
                var loggedEmailBody = $"<!-- {notificationKey} -->{email.Html}";
                var dueDate = installment.FechaPago.ToString("dd/MM/yyyy");
                var amount = installment.Cuota.ToString("N2");
                var whatsappMessage = $"Recordatorio: Su cuota vence el {dueDate}. Monto: RD$ {amount}. " +
                    $"Evite cargos por mora pagando a tiempo.";

                if (notificationService.EmailEnabled)
                {
                    try
                    {
                        await notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);
                        await LogMessageAsync(context, loan.TenantId, TipoNotificacion.Email, client.Email,
                            email.Subject, loggedEmailBody, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al enviar email de recordatorio a {Email}.", client.Email);
                        await LogMessageAsync(context, loan.TenantId, TipoNotificacion.Email, client.Email,
                            email.Subject, loggedEmailBody, cancellationToken, EstadoMensaje.Fallido);
                    }
                }

                if (!string.IsNullOrWhiteSpace(client.Telefono))
                {
                    try
                    {
                        await notificationService.SendWhatsAppAsync(client.Telefono, whatsappMessage);
                        await LogMessageAsync(context, loan.TenantId, TipoNotificacion.WhatsApp, client.Telefono,
                            "Recordatorio de vencimiento de préstamo", whatsappMessage, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al enviar WhatsApp de recordatorio a {Phone}.", client.Telefono);
                        await LogMessageAsync(context, loan.TenantId, TipoNotificacion.WhatsApp, client.Telefono,
                            "Recordatorio de vencimiento de préstamo", whatsappMessage, cancellationToken, EstadoMensaje.Fallido);
                    }
                }
            }
        }

        private static async Task LogMessageAsync(
            ApplicationDbContext context,
            Guid tenantId,
            TipoNotificacion tipo,
            string para,
            string asunto,
            string mensaje,
            CancellationToken cancellationToken,
            EstadoMensaje estado = EstadoMensaje.Enviado)
        {
            var log = new MessageLog
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Tipo = tipo,
                Para = para,
                Asunto = asunto,
                Mensaje = mensaje,
                Estado = estado,
                EnviadoEn = estado == EstadoMensaje.Enviado ? DateTime.UtcNow : null
            };

            context.MessageLogs.Add(log);
            await context.SaveChangesAsync(cancellationToken);
        }

        private static DateTime GetNextRunTime(DateTime now)
        {
            var today8am = now.Date.AddHours(8);
            if (now >= today8am)
                return today8am.AddDays(1);
            return today8am;
        }
    }
}
