using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class ClientConfiguration : IEntityTypeConfiguration<Client>
    {
        public void Configure(EntityTypeBuilder<Client> builder)
        {
            builder.ToTable("Clients");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.TenantId)
                .IsRequired();

            builder.Property(c => c.Nombre)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Cedula)
                .IsRequired()
                .HasMaxLength(20);

            builder.HasIndex(c => new { c.TenantId, c.Cedula })
                .IsUnique();

            builder.Property(c => c.Email)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Telefono)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(c => c.FechaNacimiento)
                .IsRequired();

            builder.Property(c => c.EstadoCivil)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(c => c.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(c => c.FechaRegistro)
                .IsRequired();

            builder.HasIndex(c => c.TenantId);
        }
    }
}
