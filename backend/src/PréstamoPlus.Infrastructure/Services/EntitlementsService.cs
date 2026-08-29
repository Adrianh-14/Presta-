using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Infrastructure.Persistence;
namespace PréstamoPlus.Infrastructure.Services;
public sealed class EntitlementsService : IEntitlementsService
{
    private readonly ApplicationDbContext _context;
    public EntitlementsService(ApplicationDbContext context) => _context = context;
    public async Task<EntitlementsDto> GetAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var plan = await _context.Subscriptions.Where(x => x.TenantId == tenantId).Select(x => x.PlanId).FirstOrDefaultAsync(cancellationToken) ?? "basic";
        var definition = PlanDefinitions.Plans.GetValueOrDefault(plan.ToLowerInvariant()) ?? PlanDefinitions.Plans["basic"];
        var limits = (
            Users: definition.MaxUsers < 0 ? int.MaxValue : definition.MaxUsers,
            Loans: definition.MaxLoans < 0 ? int.MaxValue : definition.MaxLoans,
            Clients: definition.MaxClients < 0 ? int.MaxValue : definition.MaxClients);
        var users = await _context.Users.CountAsync(x => x.TenantId == tenantId, cancellationToken);
        var loans = await _context.Loans.CountAsync(x => x.TenantId == tenantId && x.Estado != Domain.Enums.EstadoPrestamo.Pagado, cancellationToken);
        var clients = await _context.Clients.CountAsync(x => x.TenantId == tenantId, cancellationToken);
        return new EntitlementsDto(plan, limits.Users, limits.Loans, limits.Clients, users, loans, clients);
    }
}
