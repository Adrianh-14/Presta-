using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Security;

public static class ClientProfileAccess
{
    public static async Task<bool> IsCurrentAsync(ApplicationDbContext db, Guid clientId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var client = await db.Clients.AsNoTracking().Where(x => x.Id == clientId && x.TenantId == tenantId)
            .Select(x => new { x.FechaRegistro, x.ProfileReviewedAt }).SingleOrDefaultAsync(cancellationToken);
        if (client is null) return false;
        var months = await db.TenantConfigs.AsNoTracking().Where(x => x.TenantId == tenantId)
            .Select(x => (int?)x.ClientProfileRefreshMonths).SingleOrDefaultAsync(cancellationToken) ?? 6;
        var pending = await db.ClientProfileUpdateRequests.AsNoTracking().AnyAsync(x => x.ClientId == clientId && x.TenantId == tenantId && x.Status == "Pending", cancellationToken);
        var rejected = await db.ClientProfileUpdateRequests.AsNoTracking().Where(x => x.ClientId == clientId && x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAt).Select(x => x.Status).FirstOrDefaultAsync(cancellationToken) == "Rejected";
        return !pending && !rejected && DateTime.UtcNow < (client.ProfileReviewedAt ?? client.FechaRegistro).AddMonths(Math.Clamp(months, 1, 24));
    }
}
