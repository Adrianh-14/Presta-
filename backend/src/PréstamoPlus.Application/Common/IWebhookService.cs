namespace PréstamoPlus.Application.Common;
public interface IWebhookService { Task<bool> AcceptAsync(Guid tenantId, string provider, string eventId, string signature, string payload, CancellationToken cancellationToken = default); }
