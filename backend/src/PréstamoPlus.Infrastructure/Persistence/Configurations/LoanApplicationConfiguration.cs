using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class LoanApplicationConfiguration : IEntityTypeConfiguration<LoanApplication>
    {
        public void Configure(EntityTypeBuilder<LoanApplication> builder)
        {
            builder.ToTable("LoanApplications");

            builder.HasKey(l => l.Id);

            builder.Property(l => l.MontoSolicitado)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.TasaInteresMensual)
                .IsRequired()
                .HasColumnType("decimal(5,2)");

            builder.Property(l => l.Plazo)
                .IsRequired();

            builder.Property(l => l.UnidadPlazo)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.FrecuenciaPago)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.GastoCierrePorcentaje)
                .IsRequired()
                .HasColumnType("decimal(5,2)");

            builder.Property(l => l.CuotaEstimada)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.TotalPagar)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.TotalIntereses)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(l => l.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.TipoPrestamo)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(l => l.FechaSolicitud)
                .IsRequired();

            builder.HasOne(l => l.Client)
                .WithMany(c => c.LoanApplications)
                .HasForeignKey(l => l.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
