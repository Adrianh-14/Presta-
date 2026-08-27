using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;
namespace PréstamoPlus.Infrastructure.Services;
public sealed class WebhookService : IWebhookService
{
    private readonly ApplicationDbContext _context; private readonly IConfiguration _configuration;
    public WebhookService(ApplicationDbContext context, IConfiguration configuration) { _context=context; _configuration=configuration; }
    public async Task<bool> AcceptAsync(Guid tenantId, string provider, string eventId, string signature, string payload, CancellationToken cancellationToken = default)
    {
        var secret = _configuration[$"WebhookSecrets:{provider}"]; if (tenantId==Guid.Empty || string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(eventId)) return false;
        var expected = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant()))) return false;
        if (await _context.WebhookEvents.AnyAsync(x=>x.TenantId==tenantId && x.Provider==provider && x.EventId==eventId, cancellationToken)) return true;
        _context.WebhookEvents.Add(new WebhookEvent { Id=Guid.NewGuid(), TenantId=tenantId, Provider=provider, EventId=eventId, PayloadHash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant() });
        _context.OutboxMessages.Add(new OutboxMessage { Id=Guid.NewGuid(), TenantId=tenantId, Type=$"webhook.{provider}", Payload=payload });
        await _context.SaveChangesAsync(cancellationToken); return true;
    }
}
