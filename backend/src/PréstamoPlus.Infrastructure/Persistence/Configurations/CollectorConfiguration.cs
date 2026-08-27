using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class CollectorConfiguration : IEntityTypeConfiguration<Collector>
    {
        public void Configure(EntityTypeBuilder<Collector> builder)
        {
            builder.ToTable("Collectors");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.TenantId).IsRequired();

            builder.Property(c => c.UserId).IsRequired();

            builder.HasIndex(c => new { c.TenantId, c.UserId }).IsUnique();

            builder.Property(c => c.Cedula).IsRequired().HasMaxLength(20);

            builder.HasIndex(c => new { c.TenantId, c.Cedula }).IsUnique();

            builder.Property(c => c.Telefono).IsRequired().HasMaxLength(20);

            builder.Property(c => c.Zona).IsRequired().HasMaxLength(100);

            builder.Property(c => c.PhotoUrl).HasMaxLength(500);

            builder.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(c => c.TenantId);
        }
    }
}
