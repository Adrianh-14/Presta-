using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;
namespace PréstamoPlus.Infrastructure.Services;
public sealed class EntitlementsService : IEntitlementsService
{
    private readonly ApplicationDbContext _context;
    public EntitlementsService(ApplicationDbContext context) => _context = context;
    public async Task<EntitlementsDto> GetAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Subscriptions.Where(x => x.TenantId == tenantId).Select(x => x.PlanId).FirstOrDefaultAsync(cancellationToken) ?? "basic";
        var limits = plan.ToLowerInvariant() switch { "pro" => (100, 5000, 10000), "enterprise" => (1000, 50000, 100000), _ => (10, 250, 1000) };
        var users = await _context.Users.CountAsync(x => x.TenantId == tenantId, cancellationToken);
        var loans = await _context.Loans.CountAsync(x => x.TenantId == tenantId && x.Estado != Domain.Enums.EstadoPrestamo.Pagado, cancellationToken);
        var clients = await _context.Clients.CountAsync(x => x.TenantId == tenantId, cancellationToken);
        return new EntitlementsDto(plan, limits.Item1, limits.Item2, limits.Item3, users, loans, clients);
    }
}
