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

            builder.Property(t => t.LogoUrl)
                .HasMaxLength(500);
        }
    }
}
