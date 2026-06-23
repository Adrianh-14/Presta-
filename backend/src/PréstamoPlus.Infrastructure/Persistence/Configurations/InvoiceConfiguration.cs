using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
    {
        public void Configure(EntityTypeBuilder<Invoice> builder)
        {
            builder.ToTable("Invoices");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.TenantId)
                .IsRequired();

            builder.Property(i => i.Numero)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.Subtotal)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.MoraTotal)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.Total)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.PdfPath)
                .HasMaxLength(500);

            builder.Property(i => i.EnviadoEn)
                .IsRequired(false);

            builder.HasOne(i => i.Loan)
                .WithMany()
                .HasForeignKey(i => i.LoanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(i => i.TenantId);
            builder.HasIndex(i => i.Numero)
                .IsUnique();
        }
    }
}
