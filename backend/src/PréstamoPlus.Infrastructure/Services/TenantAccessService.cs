using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class TenantAccessService : ITenantAccessService
{
    private readonly ApplicationDbContext _db;

    public TenantAccessService(ApplicationDbContext db) => _db = db;

    public Task<bool> CanAccessAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _db.Tenants.AsNoTracking().AnyAsync(tenant =>
            tenant.Id == tenantId && tenant.IsActive && tenant.Subscription != null &&
            ((tenant.Subscription.IsComplimentary && tenant.Subscription.ComplimentaryUntil.HasValue && tenant.Subscription.ComplimentaryUntil > now) ||
             (tenant.Subscription.Status == SubscriptionStatus.Active && tenant.Subscription.CurrentPeriodEnd > now) ||
             (tenant.Subscription.Status == SubscriptionStatus.Trialing &&
              tenant.Subscription.TrialEndsAt.HasValue && tenant.Subscription.TrialEndsAt > now)),
            cancellationToken);
    }
}
