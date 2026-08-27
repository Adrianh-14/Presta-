namespace PréstamoPlus.Application.Common;

public interface ICapitalGuardService
{
    Task<decimal> GetAvailableAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task EnsureCanDisburseAsync(Guid tenantId, decimal amount, CancellationToken cancellationToken = default);
}
