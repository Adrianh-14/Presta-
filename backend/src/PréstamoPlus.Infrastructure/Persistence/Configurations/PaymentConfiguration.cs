using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.ToTable("Payments");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Monto)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(p => p.Capital)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(p => p.Interes)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(p => p.MoraPagada)
                .HasColumnType("decimal(18,2)");

            builder.Property(p => p.SaldoRestante)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(p => p.MetodoPago)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(p => p.ReferenciaExterna)
                .HasMaxLength(100);

            builder.Property(p => p.Notas)
                .HasMaxLength(500);

            builder.Property(p => p.IdempotencyKey).HasMaxLength(100);
            builder.HasIndex(p => new { p.LoanId, p.IdempotencyKey }).IsUnique()
                .HasFilter("\"IdempotencyKey\" IS NOT NULL");

            builder.HasOne(p => p.Loan)
                .WithMany(l => l.Payments)
                .HasForeignKey(p => p.LoanId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
