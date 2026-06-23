using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class LateFeeConfiguration : IEntityTypeConfiguration<LateFee>
    {
        public void Configure(EntityTypeBuilder<LateFee> builder)
        {
            builder.ToTable("LateFees");

            builder.HasKey(lf => lf.Id);

            builder.Property(lf => lf.Monto)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(lf => lf.DiasAtraso)
                .IsRequired();

            builder.Property(lf => lf.TasaAplicada)
                .IsRequired()
                .HasColumnType("decimal(5,4)");

            builder.Property(lf => lf.FechaCalculo)
                .IsRequired();

            builder.Property(lf => lf.Pagado)
                .IsRequired();

            builder.HasOne(lf => lf.Loan)
                .WithMany()
                .HasForeignKey(lf => lf.LoanId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
