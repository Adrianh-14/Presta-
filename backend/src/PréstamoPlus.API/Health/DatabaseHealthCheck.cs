using Microsoft.Extensions.Diagnostics.HealthChecks;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Health;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly ApplicationDbContext _db;

    public DatabaseHealthCheck(ApplicationDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("database erreichbar")
                : HealthCheckResult.Unhealthy("database unavailable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("database unavailable", ex);
        }
    }
}
