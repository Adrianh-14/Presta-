using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities.Tenancy;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations.Tenancy
{
    public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
    {
        public void Configure(EntityTypeBuilder<Tenant> builder)
        {
            builder.ToTable("Tenants");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Nombre)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(t => t.Slug)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(t => t.Slug)
                .IsUnique();

            builder.Property(t => t.RNC)
                .HasMaxLength(20);

            builder.Property(t => t.Email)
                .HasMaxLength(200);

            builder.Property(t => t.Telefono)
                .HasMaxLength(20);

            builder.Property(t => t.CapitalInicial)
                .IsRequired()
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);
            builder.Property(t => t.TipoEmpresa).HasMaxLength(80);
            builder.Property(t => t.ActividadEconomica).HasMaxLength(160);
            builder.Property(t => t.Direccion).HasMaxLength(250);
            builder.Property(t => t.Ciudad).HasMaxLength(100);
            builder.Property(t => t.Provincia).HasMaxLength(100);
            builder.Property(t => t.SitioWeb).HasMaxLength(250);
            builder.Property(t => t.RepresentanteTipoIdentificacion).HasMaxLength(30);
            builder.Property(t => t.RepresentanteNumeroIdentificacion).HasMaxLength(40);
            builder.Property(t => t.RepresentanteFotoIdentificacionPath).HasMaxLength(500);
            builder.Property(t => t.RepresentanteFotoPath).HasMaxLength(500);

            builder.Property(t => t.LogoUrl)
                .HasMaxLength(500);
        }
    }
}
