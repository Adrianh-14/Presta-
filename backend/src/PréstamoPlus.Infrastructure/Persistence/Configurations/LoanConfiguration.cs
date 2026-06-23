using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class LoanConfiguration : IEntityTypeConfiguration<Loan>
    {
        public void Configure(EntityTypeBuilder<Loan> builder)
        {
            builder.ToTable("Loans");

            builder.HasKey(l => l.Id);

            builder.Property(l => l.MontoOriginal)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.TasaInteresAnual)
                .IsRequired()
                .HasColumnType("decimal(5,2)");

            builder.Property(l => l.PlazoMeses)
                .IsRequired();

            builder.Property(l => l.CuotaMensual)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.SaldoPendiente)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.Tipo)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.FrecuenciaPago)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.FechaInicio)
                .IsRequired();

            builder.Property(l => l.FechaVencimiento)
                .IsRequired();

            builder.HasOne(l => l.Client)
                .WithMany()
                .HasForeignKey(l => l.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(l => l.LoanApplication)
                .WithOne(la => la.Loan)
                .HasForeignKey<Loan>(l => l.LoanApplicationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
