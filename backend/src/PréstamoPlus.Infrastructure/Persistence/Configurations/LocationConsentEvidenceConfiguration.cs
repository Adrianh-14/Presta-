using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class LocationConsentEvidenceConfiguration : IEntityTypeConfiguration<LocationConsentEvidence>
{
    public void Configure(EntityTypeBuilder<LocationConsentEvidence> builder)
    {
        builder.ToTable("LocationConsentEvidence");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Purpose).IsRequired().HasMaxLength(300);
        builder.Property(x => x.Scope).IsRequired().HasMaxLength(300);
        builder.Property(x => x.TermsVersion).IsRequired().HasMaxLength(80);
        builder.Property(x => x.ConsentTextHash).IsRequired().HasMaxLength(128);
        builder.Property(x => x.IpAddress).HasMaxLength(80);
        builder.Property(x => x.UserAgent).HasMaxLength(500);
        builder.Property(x => x.DeviceId).HasMaxLength(200);
        builder.HasIndex(x => new { x.TenantId, x.ClientId, x.GrantedAt });
    }
}
