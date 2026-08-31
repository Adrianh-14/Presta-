namespace PréstamoPlus.Application.Common;

public interface ICapitalGuardService
{
    Task<decimal> GetAvailableAsync(Guid tenantId, string currency = "DOP", CancellationToken cancellationToken = default);
    Task EnsureCanDisburseAsync(Guid tenantId, string currency, decimal amount, CancellationToken cancellationToken = default);
}
