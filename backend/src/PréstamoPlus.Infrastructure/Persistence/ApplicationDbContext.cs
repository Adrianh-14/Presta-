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
        public DbSet<PlatformPlan> PlatformPlans => Set<PlatformPlan>();
        public DbSet<PlatformPromotion> PlatformPromotions => Set<PlatformPromotion>();
        public DbSet<Client> Clients => Set<Client>();
        public DbSet<WorkInformation> WorkInformation => Set<WorkInformation>();
        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<Reference> References => Set<Reference>();
        public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
        public DbSet<LoanApplication> LoanApplications => Set<LoanApplication>();
        public DbSet<VerificationMedia> VerificationMedia => Set<VerificationMedia>();
        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<ClientOtpChallenge> ClientOtpChallenges => Set<ClientOtpChallenge>();
        public DbSet<ClientSession> ClientSessions => Set<ClientSession>();
        public DbSet<ClientAuthenticationEvent> ClientAuthenticationEvents => Set<ClientAuthenticationEvent>();
        public DbSet<Loan> Loans => Set<Loan>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<LateFee> LateFees => Set<LateFee>();
        public DbSet<Installment> Installments => Set<Installment>();
        public DbSet<TenantConfig> TenantConfigs => Set<TenantConfig>();
        public DbSet<MessageLog> MessageLogs => Set<MessageLog>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<Collector> Collectors => Set<Collector>();
        public DbSet<CollectionAssignment> CollectionAssignments => Set<CollectionAssignment>();
        public DbSet<CollectionVisit> CollectionVisits => Set<CollectionVisit>();
        public DbSet<Expense> Expenses => Set<Expense>();
        public DbSet<PaymentQR> PaymentQRs => Set<PaymentQR>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<LedgerAccount> LedgerAccounts => Set<LedgerAccount>();
        public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
        public DbSet<JournalLine> JournalLines => Set<JournalLine>();
        public DbSet<CashAccount> CashAccounts => Set<CashAccount>();
        public DbSet<BankMovement> BankMovements => Set<BankMovement>();
        public DbSet<DailyCashClosure> DailyCashClosures => Set<DailyCashClosure>();
        public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
        public DbSet<JobLock> JobLocks => Set<JobLock>();
        public DbSet<AnomalyAlert> AnomalyAlerts => Set<AnomalyAlert>();
        public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            PreventAuditMutation();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            PreventAuditMutation();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        private void PreventAuditMutation()
        {
            if (ChangeTracker.Entries<AuditLog>().Any(entry => entry.State is EntityState.Modified or EntityState.Deleted))
                throw new InvalidOperationException("La bitácora de auditoría es inmutable.");
            if (ChangeTracker.Entries<JournalEntry>().Any(entry => entry.State is EntityState.Modified or EntityState.Deleted) ||
                ChangeTracker.Entries<JournalLine>().Any(entry => entry.State is EntityState.Modified or EntityState.Deleted))
                throw new InvalidOperationException("Los asientos contables posteados son inmutables; use un contra-asiento.");
            if (ChangeTracker.Entries<DailyCashClosure>().Any(entry => entry.State is EntityState.Modified or EntityState.Deleted))
                throw new InvalidOperationException("El cierre diario es inmutable; use una reapertura auditada.");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
            base.OnModelCreating(modelBuilder);
        }
    }
}
