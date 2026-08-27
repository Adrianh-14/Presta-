using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(120);
        builder.Property(x => x.EntityType).IsRequired().HasMaxLength(120);
        builder.Property(x => x.MetadataJson).IsRequired();
        builder.Property(x => x.PreviousHash).IsRequired().HasMaxLength(128);
        builder.Property(x => x.Hash).IsRequired().HasMaxLength(128);
        builder.HasIndex(x => new { x.TenantId, x.CreatedAt });
        builder.HasIndex(x => x.Hash).IsUnique();
    }
}
