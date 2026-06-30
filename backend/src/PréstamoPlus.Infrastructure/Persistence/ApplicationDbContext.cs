using Microsoft.EntityFrameworkCore;
using Npgsql;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;

namespace PréstamoPlus.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        static ApplicationDbContext()
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);
        }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Tenant> Tenants => Set<Tenant>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<Client> Clients => Set<Client>();
        public DbSet<WorkInformation> WorkInformation => Set<WorkInformation>();
        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<Reference> References => Set<Reference>();
        public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
        public DbSet<LoanApplication> LoanApplications => Set<LoanApplication>();
        public DbSet<VerificationMedia> VerificationMedia => Set<VerificationMedia>();
        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<Loan> Loans => Set<Loan>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<LateFee> LateFees => Set<LateFee>();
        public DbSet<Installment> Installments => Set<Installment>();
        public DbSet<TenantConfig> TenantConfigs => Set<TenantConfig>();
        public DbSet<MessageLog> MessageLogs => Set<MessageLog>();
        public DbSet<Invoice> Invoices => Set<Invoice>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
            base.OnModelCreating(modelBuilder);
        }
    }
}
