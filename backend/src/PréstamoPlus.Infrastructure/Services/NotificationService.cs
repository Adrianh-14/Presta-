using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger)
        {
            _logger = logger;
        }

        public Task SendWhatsAppAsync(string to, string message)
        {
            _logger.LogInformation("[WhatsApp] Para: {To} | Mensaje: {Message}", to, message);
            return Task.CompletedTask;
        }

        public Task SendEmailAsync(string to, string subject, string body)
        {
            _logger.LogInformation("[Email] Para: {To} | Asunto: {Subject} | Body: {Body}", to, subject, body);
            return Task.CompletedTask;
        }
    }
}
