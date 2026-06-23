using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class BankAccountConfiguration : IEntityTypeConfiguration<BankAccount>
    {
        public void Configure(EntityTypeBuilder<BankAccount> builder)
        {
            builder.ToTable("BankAccounts");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Banco)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(b => b.TipoCuenta)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(b => b.NumeroCuenta)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasOne(b => b.Client)
                .WithOne(c => c.BankAccount)
                .HasForeignKey<BankAccount>(b => b.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
