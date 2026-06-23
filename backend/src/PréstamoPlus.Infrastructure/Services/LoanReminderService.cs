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

                try
                {
                    await ProcessRemindersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al procesar recordatorios de préstamos.");
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

            var loansDueSoon = await context.Loans
                .Where(l => l.Estado == EstadoPrestamo.Activo
                    && l.FechaVencimiento.Date == reminderWindow)
                .Include(l => l.Client)
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                "Encontrados {Count} préstamos venciendo el {Date}.",
                loansDueSoon.Count,
                reminderWindow.ToString("dd/MM/yyyy"));

            foreach (var loan in loansDueSoon)
            {
                var client = loan.Client;
                if (client == null || string.IsNullOrWhiteSpace(client.Email))
                {
                    _logger.LogWarning(
                        "Préstamo {LoanId} sin cliente o sin email, se omite recordatorio.",
                        loan.Id);
                    continue;
                }

                var clientName = client.Nombre;
                var dueDate = loan.FechaVencimiento.ToString("dd/MM/yyyy");
                var amount = loan.SaldoPendiente.ToString("C");

                var emailBody = $"Estimado/a {clientName}, le recordamos que su préstamo con saldo pendiente " +
                    $"de {amount} vence el {dueDate}. Por favor realice su pago a tiempo para evitar cargos por mora.";
                var whatsappMessage = $"Recordatorio: Su préstamo vence el {dueDate}. Saldo: {amount}. " +
                    $"Evite cargos por mora pagando a tiempo.";

                try
                {
                    await notificationService.SendEmailAsync(client.Email, "Recordatorio de vencimiento de préstamo", emailBody);
                    await LogMessageAsync(context, loan.TenantId, TipoNotificacion.Email, client.Email,
                        "Recordatorio de vencimiento de préstamo", emailBody, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar email de recordatorio a {Email}.", client.Email);
                    await LogMessageAsync(context, loan.TenantId, TipoNotificacion.Email, client.Email,
                        "Recordatorio de vencimiento de préstamo", emailBody, cancellationToken, EstadoMensaje.Fallido);
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
