using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class ResendClientOtpSender : IClientOtpSender
{
    private static readonly HttpClient HttpClient = new();
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly ILogger<ResendClientOtpSender> _logger;

    public ResendClientOtpSender(
        IConfiguration configuration,
        ILogger<ResendClientOtpSender> logger)
    {
        _apiKey = configuration["Resend:ApiKey"] ?? string.Empty;
        _fromEmail = configuration["Resend:FromEmail"] ?? "onboarding@resend.dev";
        _fromName = configuration["Resend:FromName"] ?? "PrestamoPlus";
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_apiKey) && !string.IsNullOrWhiteSpace(_fromEmail);

    public async Task SendAsync(
        ClientOtpDelivery delivery,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogError("No se puede enviar OTP: Resend no está configurado.");
            return;
        }

        var safeName = WebUtility.HtmlEncode(delivery.ClientName);
        var safeCode = WebUtility.HtmlEncode(delivery.Code);
        var html = $$"""
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0b3558">
              <h2>Código de acceso a PréstamoPlus</h2>
              <p>Hola {{safeName}},</p>
              <p>Usa este código una sola vez para entrar a tu portal:</p>
              <p style="font-size:32px;font-weight:700;letter-spacing:8px">{{safeCode}}</p>
              <p>El código vence en {{delivery.ExpiresInMinutes}} minutos.</p>
              <p>Si no solicitaste este acceso, ignora el mensaje y no compartas el código.</p>
            </div>
            """;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = JsonContent.Create(new
        {
            from = $"{_fromName} <{_fromEmail}>",
            to = new[] { delivery.Email },
            subject = "Tu código de acceso a PréstamoPlus",
            html
        });

        using var response = await HttpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "El proveedor de correo rechazó una entrega OTP. Estado: {StatusCode}",
                (int)response.StatusCode);
        }
    }
}
