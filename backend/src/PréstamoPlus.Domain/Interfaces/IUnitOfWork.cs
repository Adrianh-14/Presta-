using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IClientRepository Clients { get; }
        ILoanApplicationRepository LoanApplications { get; }
        IUserRepository Users { get; }
        IRepositoryBase<Loan> Loans { get; }
        IRepositoryBase<Payment> Payments { get; }
        IRepositoryBase<LateFee> LateFees { get; }
        IRepositoryBase<WorkInformation> WorkInformation { get; }
        IRepositoryBase<Address> Addresses { get; }
        IRepositoryBase<Reference> References { get; }
        IRepositoryBase<BankAccount> BankAccounts { get; }
        IRepositoryBase<VerificationMedia> VerificationMedia { get; }
        IRepositoryBase<RefreshToken> RefreshTokens { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    }
}
