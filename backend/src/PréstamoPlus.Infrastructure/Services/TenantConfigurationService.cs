using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;
namespace PréstamoPlus.Infrastructure.Services;
public sealed class TenantConfigurationService : ITenantConfigurationService
{
    private readonly ApplicationDbContext _context;
    public TenantConfigurationService(ApplicationDbContext context) => _context = context;
    public async Task<TenantBrandingDto?> GetAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==tenantId, cancellationToken); if (tenant is null) return null;
        return await BuildAsync(tenant, cancellationToken);
    }
    public async Task<TenantBrandingDto?> UpdateAsync(Guid tenantId, UpdateTenantBrandingRequest request, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants.SingleOrDefaultAsync(x=>x.Id==tenantId, cancellationToken); if (tenant is null) return null;
        if (string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Length > 160) throw new ArgumentException("Nombre de institución inválido.");
        tenant.Nombre=request.Nombre.Trim(); tenant.LogoUrl=string.IsNullOrWhiteSpace(request.LogoUrl)?null:request.LogoUrl.Trim(); tenant.Email=request.Email?.Trim(); tenant.Telefono=request.Telefono?.Trim(); tenant.UpdatedAt=DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(tenant.Nombre) && await _context.Users.AnyAsync(x=>x.TenantId==tenantId, cancellationToken) && await _context.Clients.AnyAsync(x=>x.TenantId==tenantId, cancellationToken)) tenant.OnboardingCompletedAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken); return await BuildAsync(tenant, cancellationToken);
    }
    private async Task<TenantBrandingDto> BuildAsync(Domain.Entities.Tenancy.Tenant tenant, CancellationToken cancellationToken) => new(tenant.Id, tenant.Nombre, tenant.Slug, tenant.LogoUrl, tenant.Email, tenant.Telefono, tenant.OnboardingCompletedAt.HasValue, await _context.Users.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken), await _context.Clients.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken), await _context.Loans.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken));
}
