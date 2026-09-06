using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Domain;
using System.Text.Json;
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
        if (request.MonedasHabilitadas is not null)
        {
            var currencies = request.MonedasHabilitadas.Where(CurrencyCatalog.IsSupported).Select(CurrencyCatalog.Normalize).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (currencies.Count == 0) throw new ArgumentException("Debes mantener al menos una divisa habilitada.");
            if (!currencies.Contains(tenant.MonedaPredeterminada, StringComparer.OrdinalIgnoreCase)) throw new ArgumentException("La divisa predeterminada debe permanecer habilitada.");
            tenant.MonedasHabilitadas = string.Join(',', currencies);
            if (request.CapitalInicialPorMoneda is not null)
            {
                var capital = request.CapitalInicialPorMoneda
                    .Where(x => currencies.Contains(x.Key, StringComparer.OrdinalIgnoreCase) && x.Value >= 0)
                    .ToDictionary(x => CurrencyCatalog.Normalize(x.Key), x => x.Value, StringComparer.OrdinalIgnoreCase);
                if (capital.Count != currencies.Count) throw new ArgumentException("Indica un capital inicial válido para cada divisa habilitada.");
                tenant.CapitalInicialPorMonedaJson = JsonSerializer.Serialize(capital);
                if (capital.TryGetValue("DOP", out var dop)) tenant.CapitalInicial = dop;
                if (capital.TryGetValue("USD", out var usd)) tenant.CapitalInicialUsd = usd;
                if (capital.TryGetValue("EUR", out var eur)) tenant.CapitalInicialEur = eur;
            }
        }
        if (!string.IsNullOrWhiteSpace(tenant.Nombre) && await _context.Users.AnyAsync(x=>x.TenantId==tenantId, cancellationToken) && await _context.Clients.AnyAsync(x=>x.TenantId==tenantId, cancellationToken)) tenant.OnboardingCompletedAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken); return await BuildAsync(tenant, cancellationToken);
    }
    private async Task<TenantBrandingDto> BuildAsync(Domain.Entities.Tenancy.Tenant tenant, CancellationToken cancellationToken) => new(tenant.Id, tenant.Nombre, tenant.Slug, tenant.LogoUrl, tenant.Email, tenant.Telefono, tenant.OnboardingCompletedAt.HasValue, await _context.Users.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken), await _context.Clients.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken), await _context.Loans.CountAsync(x=>x.TenantId==tenant.Id,cancellationToken), tenant.MonedasHabilitadas.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries), JsonSerializer.Deserialize<Dictionary<string, decimal>>(tenant.CapitalInicialPorMonedaJson) ?? new());
}
