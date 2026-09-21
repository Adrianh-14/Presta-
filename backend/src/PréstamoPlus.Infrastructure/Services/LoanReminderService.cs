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

            var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, GetSantoDomingoTimeZone());
            var today = localNow.Date;
            var activeLoans = await context.Loans
                .Where(l => l.Estado == EstadoPrestamo.Activo ||
                            l.Estado == EstadoPrestamo.Mora ||
                            l.Estado == EstadoPrestamo.Vencido)
                .Include(l => l.Client)
                .Include(l => l.Installments)
                .ToListAsync(cancellationToken);

            var reminders = new List<(Loan Loan, Installment Installment, int DaysUntilDue, string Key)>();
            foreach (var loan in activeLoans)
            {
                var client = loan.Client;
                if (client == null || string.IsNullOrWhiteSpace(client.Email))
                {
                    _logger.LogWarning(
                        "Préstamo {LoanId} sin cliente o sin email, se omite recordatorio.",
                        loan.Id);
                    continue;
                }

                var pending = loan.Installments
                    .Where(i => i.Estado != EstadoInstallment.Pagado)
                    .OrderBy(i => i.FechaPago)
                    .ThenBy(i => i.Numero)
                    .ToList();
                if (pending.Count == 0) continue;

                if (loan.FrecuenciaPago == FrecuenciaPago.Diaria)
                {
                    var installment = pending.FirstOrDefault(i => i.FechaPago.Date <= today);
                    if (installment != null)
                        reminders.Add((loan, installment, Math.Max(0, (installment.FechaPago.Date - today).Days),
                            $"loan-payment-reminder:{loan.Id:N}:daily:{today:yyyyMMdd}"));
                    continue;
                }

                var offsets = loan.FrecuenciaPago switch
                {
                    FrecuenciaPago.Semanal => new[] { 1, 0 },
                    FrecuenciaPago.Quincenal => new[] { 2, 1, 0 },
                    FrecuenciaPago.Mensual => new[] { 2, 1, 0 },
                    _ => Array.Empty<int>()
                };

                foreach (var installment in pending)
                {
                    var daysUntilDue = (installment.FechaPago.Date - today).Days;
                    if (!offsets.Contains(daysUntilDue)) continue;
                    reminders.Add((loan, installment, daysUntilDue,
                        $"loan-payment-reminder:{loan.Id:N}:{installment.Numero}:d{daysUntilDue}"));
                }
            }

            _logger.LogInformation("Encontrados {Count} recordatorios de pago para {Date}.", reminders.Count, today.ToString("dd/MM/yyyy"));

            foreach (var reminder in reminders)
            {
                var loan = reminder.Loan;
                var installment = reminder.Installment;
                var client = loan.Client!;
                var notificationKey = reminder.Key;
                var alreadySent = await context.MessageLogs.AnyAsync(log =>
                    log.Tipo == TipoNotificacion.Email &&
                    log.Estado == EstadoMensaje.Enviado &&
                    log.Mensaje.Contains(notificationKey), cancellationToken);
                if (alreadySent) continue;

                var email = LoanEmailBuilder.UpcomingPayment(
                    loan,
                    client,
                    installment,
                    notificationService.ClientPortalUrl,
                    reminder.DaysUntilDue == 0 ? "hoy" : $"en {reminder.DaysUntilDue} días");
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
            var timeZone = GetSantoDomingoTimeZone();
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(now, timeZone);
            var localTarget = localNow.Date.AddHours(15);
            if (localNow >= localTarget) localTarget = localTarget.AddDays(1);
            return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localTarget, DateTimeKind.Unspecified), timeZone);
        }

        private static TimeZoneInfo GetSantoDomingoTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("America/Santo_Domingo"); }
            catch (TimeZoneNotFoundException)
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById("SA Western Standard Time"); }
                catch (TimeZoneNotFoundException) { return TimeZoneInfo.Utc; }
                catch (InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
            }
            catch (InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
        }
    }
}
