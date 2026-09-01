using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class LocationAccessAuditConfiguration : IEntityTypeConfiguration<LocationAccessAudit>
{
    public void Configure(EntityTypeBuilder<LocationAccessAudit> builder)
    {
        builder.ToTable("LocationAccessAudits");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(80);
        builder.HasIndex(x => new { x.TenantId, x.SessionId, x.CreatedAt });
    }
}
