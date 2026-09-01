namespace PréstamoPlus.Application.Common;
public sealed record TenantBrandingDto(Guid TenantId, string Nombre, string Slug, string? LogoUrl, string? Email, string? Telefono, bool OnboardingCompleted, int Users, int Clients, int Loans, IReadOnlyList<string> MonedasHabilitadas);
public sealed record UpdateTenantBrandingRequest(string Nombre, string? LogoUrl, string? Email, string? Telefono, IReadOnlyList<string>? MonedasHabilitadas = null);
public interface ITenantConfigurationService { Task<TenantBrandingDto?> GetAsync(Guid tenantId, CancellationToken cancellationToken = default); Task<TenantBrandingDto?> UpdateAsync(Guid tenantId, UpdateTenantBrandingRequest request, CancellationToken cancellationToken = default); }
