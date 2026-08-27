namespace PréstamoPlus.Application.Common;

public sealed record BankMovementInput(Guid CashAccountId, DateTime OccurredAt, decimal Amount, bool IsCredit, string ExternalReference, string Description);

public interface ICashManagementService
{
    Task<Guid> ImportMovementAsync(Guid tenantId, BankMovementInput movement, CancellationToken cancellationToken = default);
    Task<Guid> CloseDayAsync(Guid tenantId, DateOnly date, decimal countedBalance, Guid closedBy, CancellationToken cancellationToken = default);
}
