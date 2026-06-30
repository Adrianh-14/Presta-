using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class InstallmentConfiguration : IEntityTypeConfiguration<Installment>
    {
        public void Configure(EntityTypeBuilder<Installment> builder)
        {
            builder.ToTable("Installments");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.Numero)
                .IsRequired();

            builder.Property(i => i.FechaPago)
                .IsRequired();

            builder.Property(i => i.Capital)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.Interes)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.Cuota)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.CapitalPagado)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.InteresPagado)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.MoraPagada)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(i => i.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.HasOne(i => i.Loan)
                .WithMany(l => l.Installments)
                .HasForeignKey(i => i.LoanId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
