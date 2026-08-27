using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ILogger<NotificationService> _logger;
        private static readonly HttpClient HttpClient = new();
        private readonly ResendSettings _settings;

        public NotificationService(
            IConfiguration configuration,
            ILogger<NotificationService> logger)
        {
            _settings = new ResendSettings
            {
                ApiKey = configuration["Resend:ApiKey"] ?? string.Empty,
                FromEmail = configuration["Resend:FromEmail"] ?? "onboarding@resend.dev",
                FromName = configuration["Resend:FromName"] ?? "PrestamoPlus",
                ClientPortalUrl = configuration["Resend:ClientPortalUrl"] ?? "http://localhost:5173/portal/login"
            };
            _logger = logger;
        }

        public bool EmailEnabled => !string.IsNullOrWhiteSpace(_settings.ApiKey);
        public string ClientPortalUrl => _settings.ClientPortalUrl;

        public Task SendWhatsAppAsync(string to, string message)
        {
            _logger.LogInformation("[WhatsApp] Para: {To} | Mensaje: {Message}", to, message);
            return Task.CompletedTask;
        }

        public async Task SendEmailAsync(
            string to,
            string subject,
            string body,
            IReadOnlyCollection<EmailAttachment>? attachments = null)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                _logger.LogWarning("No se envió el correo a {To}: Resend:ApiKey no está configurada.", to);
                return;
            }

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
                var payload = new Dictionary<string, object>
                {
                    ["from"] = $"{_settings.FromName} <{_settings.FromEmail}>",
                    ["to"] = new[] { to },
                    ["subject"] = subject,
                    ["html"] = body
                };
                if (attachments is { Count: > 0 })
                {
                    payload["attachments"] = attachments.Select(attachment => new
                    {
                        filename = attachment.FileName,
                        content = Convert.ToBase64String(attachment.Content)
                    }).ToArray();
                }
                request.Content = JsonContent.Create(payload);

                using var response = await HttpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "Resend rechazó el correo a {To}. Estado: {StatusCode}. Respuesta: {Response}",
                        to,
                        (int)response.StatusCode,
                        responseBody);
                    return;
                }

                _logger.LogInformation("Correo enviado con Resend a {To}. Respuesta: {Response}", to, responseBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enviando correo con Resend a {To}", to);
            }
        }
    }
}
