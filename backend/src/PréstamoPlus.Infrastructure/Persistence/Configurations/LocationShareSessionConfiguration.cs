using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class LocationShareSessionConfiguration : IEntityTypeConfiguration<LocationShareSession>
{
    public void Configure(EntityTypeBuilder<LocationShareSession> builder)
    {
        builder.ToTable("LocationShareSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(30);
        builder.HasIndex(x => new { x.TenantId, x.ClientId, x.Status });
        builder.HasIndex(x => new { x.TenantId, x.CollectorId, x.ExpiresAt });
    }
}
