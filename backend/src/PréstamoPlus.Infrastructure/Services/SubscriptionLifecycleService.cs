using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

/// Applies the tenant grace period and suspends expired workspaces automatically.
public sealed class SubscriptionLifecycleService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionLifecycleService> _logger;
    public SubscriptionLifecycleService(IServiceScopeFactory scopeFactory, ILogger<SubscriptionLifecycleService> logger)
        => (_scopeFactory, _logger) = (scopeFactory, logger);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Sweep(stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken)) await Sweep(stoppingToken);
    }

    private async Task Sweep(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var rows = await db.Tenants.Include(x => x.Subscription).Include(x => x.Users).ToListAsync(ct);
            var changed = false;
            foreach (var tenant in rows)
            {
                var config = await db.TenantConfigs.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == tenant.Id, ct);
                var grace = config?.DiasGracia ?? 3;
                var sub = tenant.Subscription;
                if (sub is null) continue;
                var expiry = sub.Status == SubscriptionStatus.Trialing ? sub.TrialEndsAt : sub.CurrentPeriodEnd;
                var shouldSuspend = expiry.HasValue && expiry.Value.AddDays(grace) <= now && sub.Status != SubscriptionStatus.Cancelled;
                if (shouldSuspend && tenant.IsActive) { tenant.IsActive = false; tenant.UpdatedAt = now; changed = true; }
            }
            if (changed) await db.SaveChangesAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { }
        catch (Exception ex) { _logger.LogError(ex, "Error aplicando ciclo de suscripciones"); }
    }
}
