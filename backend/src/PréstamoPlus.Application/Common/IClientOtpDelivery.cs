namespace PréstamoPlus.Application.Common;

public sealed record ClientOtpDelivery(
    string Email,
    string ClientName,
    string Code,
    int ExpiresInMinutes,
    string Purpose = "login");

public interface IClientOtpDeliveryQueue
{
    bool TryQueue(ClientOtpDelivery delivery);
}

public interface IClientOtpSender
{
    bool IsConfigured { get; }
    Task SendAsync(ClientOtpDelivery delivery, CancellationToken cancellationToken = default);
}
