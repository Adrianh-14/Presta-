using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class AuditLogService : IAuditLogService
{
    private static readonly SemaphoreSlim ChainLock = new(1, 1);
    private readonly ApplicationDbContext _db;

    public AuditLogService(ApplicationDbContext db) => _db = db;

    public async Task AppendAsync(Guid tenantId, Guid? actorUserId, string action, string entityType, Guid? entityId, object? metadata = null, CancellationToken cancellationToken = default)
    {
        await ChainLock.WaitAsync(cancellationToken);
        try
        {
            var previous = await _db.AuditLogs
                .Where(x => x.TenantId == tenantId)
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .Select(x => x.Hash)
                .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
            var entry = new AuditLog
            {
                Id = Guid.NewGuid(), TenantId = tenantId, ActorUserId = actorUserId,
                Action = action, EntityType = entityType, EntityId = entityId,
                MetadataJson = JsonSerializer.Serialize(metadata ?? new { }),
                CreatedAt = DateTime.UtcNow, PreviousHash = previous
            };
            entry.Hash = AuditLogHasher.Compute(entry);
            _db.AuditLogs.Add(entry);
            await _db.SaveChangesAsync(cancellationToken);
        }
        finally { ChainLock.Release(); }
    }

}
