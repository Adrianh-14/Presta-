using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class PaymentQRConfiguration : IEntityTypeConfiguration<PaymentQR>
    {
        public void Configure(EntityTypeBuilder<PaymentQR> builder)
        {
            builder.ToTable("PaymentQRs");

            builder.HasKey(q => q.Id);

            builder.Property(q => q.Token).IsRequired().HasMaxLength(100);

            builder.HasIndex(q => q.Token).IsUnique();

            builder.Property(q => q.Monto).HasColumnType("decimal(18,2)").IsRequired();

            builder.Property(q => q.ExpiresAt).IsRequired();

            builder.Property(q => q.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.HasIndex(q => q.AssignmentId);

            builder.HasIndex(q => q.CollectorId);

            builder.HasOne(q => q.Assignment)
                .WithMany()
                .HasForeignKey(q => q.AssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(q => q.Collector)
                .WithMany()
                .HasForeignKey(q => q.CollectorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(q => q.Loan)
                .WithMany()
                .HasForeignKey(q => q.LoanId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(q => q.Client)
                .WithMany()
                .HasForeignKey(q => q.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
