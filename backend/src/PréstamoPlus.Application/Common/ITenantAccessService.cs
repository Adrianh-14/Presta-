namespace PréstamoPlus.Application.Common;

public interface ITenantAccessService
{
    Task<bool> CanAccessAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
