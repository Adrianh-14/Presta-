using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;
namespace PréstamoPlus.Infrastructure.Persistence.Configurations;
public sealed class AnomalyAlertConfiguration : IEntityTypeConfiguration<AnomalyAlert>
{
    public void Configure(EntityTypeBuilder<AnomalyAlert> builder)
    {
        builder.ToTable("AnomalyAlerts"); builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Severity).IsRequired().HasMaxLength(20);
        builder.Property(x => x.Evidence).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.RecommendedAction).IsRequired().HasMaxLength(500);
        builder.HasIndex(x => new { x.TenantId, x.Reviewed, x.DetectedAt });
    }
}
