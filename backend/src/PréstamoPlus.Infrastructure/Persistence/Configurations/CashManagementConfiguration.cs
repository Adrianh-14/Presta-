using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class CashAccountConfiguration : IEntityTypeConfiguration<CashAccount>
{
    public void Configure(EntityTypeBuilder<CashAccount> builder)
    {
        builder.ToTable("CashAccounts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(120);
        builder.Property(x => x.Currency).IsRequired().HasMaxLength(3);
        builder.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
    }
}

public sealed class BankMovementConfiguration : IEntityTypeConfiguration<BankMovement>
{
    public void Configure(EntityTypeBuilder<BankMovement> builder)
    {
        builder.ToTable("BankMovements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalReference).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(240);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.TenantId, x.ExternalReference }).IsUnique();
        builder.HasOne(x => x.CashAccount).WithMany(x => x.Movements).HasForeignKey(x => x.CashAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class DailyCashClosureConfiguration : IEntityTypeConfiguration<DailyCashClosure>
{
    public void Configure(EntityTypeBuilder<DailyCashClosure> builder)
    {
        builder.ToTable("DailyCashClosures");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExpectedBalance).HasPrecision(18, 2);
        builder.Property(x => x.CountedBalance).HasPrecision(18, 2);
        builder.Property(x => x.Difference).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.TenantId, x.BusinessDate }).IsUnique();
    }
}
