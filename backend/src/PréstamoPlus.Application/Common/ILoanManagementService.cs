namespace PréstamoPlus.Application.Common
{
    public interface ILoanManagementService
    {
        Task ProcessOverdueLoansAsync(CancellationToken cancellationToken = default);
    }
}
