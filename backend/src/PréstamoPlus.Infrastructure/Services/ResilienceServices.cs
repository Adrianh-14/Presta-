using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class OutboxService : IOutboxService
{
    private readonly ApplicationDbContext _context;
    public OutboxService(ApplicationDbContext context) => _context = context;
    public async Task EnqueueAsync(Guid tenantId, string type, string payload, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(payload)) throw new ArgumentException("Mensaje outbox inválido.");
        _context.OutboxMessages.Add(new OutboxMessage { Id = Guid.NewGuid(), TenantId = tenantId, Type = type.Trim(), Payload = payload });
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public sealed class DistributedJobLock : IDistributedJobLock
{
    private readonly ApplicationDbContext _context;
    public DistributedJobLock(ApplicationDbContext context) => _context = context;
    public async Task<bool> TryAcquireAsync(string name, string owner, TimeSpan lease, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var row = await _context.JobLocks.SingleOrDefaultAsync(item => item.Name == name, cancellationToken);
        if (row is not null && row.LeaseUntil > now && row.Owner != owner) return false;
        if (row is null) _context.JobLocks.Add(new JobLock { Name = name, Owner = owner, LeaseUntil = now.Add(lease) });
        else { row.Owner = owner; row.LeaseUntil = now.Add(lease); row.UpdatedAt = now; }
        try { await _context.SaveChangesAsync(cancellationToken); return true; }
        catch (DbUpdateException) { return false; }
    }
    public async Task ReleaseAsync(string name, string owner, CancellationToken cancellationToken = default)
    {
        var row = await _context.JobLocks.SingleOrDefaultAsync(item => item.Name == name && item.Owner == owner, cancellationToken);
        if (row is null) return;
        row.LeaseUntil = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
