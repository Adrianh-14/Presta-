using Ardalis.Specification;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction? _transaction;

        private IClientRepository? _clients;
        private ILoanApplicationRepository? _loanApplications;
        private IUserRepository? _users;
        private GenericRepository<Loan>? _loans;
        private GenericRepository<Payment>? _payments;
        private GenericRepository<LateFee>? _lateFees;
        private GenericRepository<Installment>? _installments;
        private GenericRepository<WorkInformation>? _workInformation;
        private GenericRepository<Address>? _addresses;
        private GenericRepository<Reference>? _references;
        private GenericRepository<BankAccount>? _bankAccounts;
        private GenericRepository<VerificationMedia>? _verificationMedia;
        private GenericRepository<RefreshToken>? _refreshTokens;
        private GenericRepository<Collector>? _collectors;
        private GenericRepository<CollectionAssignment>? _collectionAssignments;
        private GenericRepository<CollectionVisit>? _collectionVisits;
        private GenericRepository<Expense>? _expenses;
        private GenericRepository<PaymentQR>? _paymentQRs;
        private GenericRepository<Tenant>? _tenants;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IClientRepository Clients =>
            _clients ??= new ClientRepository(_context);

        public ILoanApplicationRepository LoanApplications =>
            _loanApplications ??= new LoanApplicationRepository(_context);

        public IUserRepository Users =>
            _users ??= new UserRepository(_context);

        public IRepositoryBase<Loan> Loans =>
            _loans ??= new GenericRepository<Loan>(_context);

        public IRepositoryBase<Payment> Payments =>
            _payments ??= new GenericRepository<Payment>(_context);

        public IRepositoryBase<LateFee> LateFees =>
            _lateFees ??= new GenericRepository<LateFee>(_context);

        public IRepositoryBase<Installment> Installments =>
            _installments ??= new GenericRepository<Installment>(_context);

        public IRepositoryBase<WorkInformation> WorkInformation =>
            _workInformation ??= new GenericRepository<WorkInformation>(_context);

        public IRepositoryBase<Address> Addresses =>
            _addresses ??= new GenericRepository<Address>(_context);

        public IRepositoryBase<Reference> References =>
            _references ??= new GenericRepository<Reference>(_context);

        public IRepositoryBase<BankAccount> BankAccounts =>
            _bankAccounts ??= new GenericRepository<BankAccount>(_context);

        public IRepositoryBase<VerificationMedia> VerificationMedia =>
            _verificationMedia ??= new GenericRepository<VerificationMedia>(_context);

        public IRepositoryBase<RefreshToken> RefreshTokens =>
            _refreshTokens ??= new GenericRepository<RefreshToken>(_context);

        public IRepositoryBase<Collector> Collectors =>
            _collectors ??= new GenericRepository<Collector>(_context);

        public IRepositoryBase<CollectionAssignment> CollectionAssignments =>
            _collectionAssignments ??= new GenericRepository<CollectionAssignment>(_context);

        public IRepositoryBase<CollectionVisit> CollectionVisits =>
            _collectionVisits ??= new GenericRepository<CollectionVisit>(_context);

        public IRepositoryBase<Expense> Expenses =>
            _expenses ??= new GenericRepository<Expense>(_context);

        public IRepositoryBase<PaymentQR> PaymentQRs =>
            _paymentQRs ??= new GenericRepository<PaymentQR>(_context);

        public IRepositoryBase<Tenant> Tenants =>
            _tenants ??= new GenericRepository<Tenant>(_context);

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        }

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction is not null)
            {
                await _transaction.CommitAsync(cancellationToken);
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction is not null)
            {
                await _transaction.RollbackAsync(cancellationToken);
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
