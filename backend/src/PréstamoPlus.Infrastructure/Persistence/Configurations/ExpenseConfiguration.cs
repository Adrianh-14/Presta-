using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
    {
        public void Configure(EntityTypeBuilder<Expense> builder)
        {
            builder.ToTable("Expenses");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.TenantId).IsRequired();

            builder.Property(e => e.Category)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(30);

            builder.Property(e => e.Description).IsRequired().HasMaxLength(200);

            builder.Property(e => e.Amount).HasColumnType("decimal(18,2)").IsRequired();

            builder.Property(e => e.Date).IsRequired();

            builder.Property(e => e.RecordedBy).IsRequired();

            builder.Property(e => e.ReceiptUrl).HasMaxLength(500);

            builder.HasIndex(e => e.TenantId);

            builder.HasIndex(e => new { e.TenantId, e.Date });

            builder.HasOne(e => e.RecordedByUser)
                .WithMany()
                .HasForeignKey(e => e.RecordedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
