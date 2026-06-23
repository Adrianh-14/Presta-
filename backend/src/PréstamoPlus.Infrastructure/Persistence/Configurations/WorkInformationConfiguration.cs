using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class WorkInformationConfiguration : IEntityTypeConfiguration<WorkInformation>
    {
        public void Configure(EntityTypeBuilder<WorkInformation> builder)
        {
            builder.ToTable("WorkInformation");

            builder.HasKey(w => w.Id);

            builder.Property(w => w.Empresa)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(w => w.Cargo)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(w => w.Salario)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            builder.Property(w => w.AntiguedadAnios)
                .IsRequired();

            builder.Property(w => w.DireccionEmpresa)
                .HasMaxLength(500);

            builder.Property(w => w.TelefonoEmpresa)
                .HasMaxLength(20);

            builder.Property(w => w.TipoEmpleo)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.HasOne(w => w.Client)
                .WithOne(c => c.WorkInformation)
                .HasForeignKey<WorkInformation>(w => w.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
