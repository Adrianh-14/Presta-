using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;
namespace PréstamoPlus.Infrastructure.Persistence.Configurations;
public sealed class WebhookEventConfiguration : IEntityTypeConfiguration<WebhookEvent>
{
    public void Configure(EntityTypeBuilder<WebhookEvent> builder)
    { builder.ToTable("WebhookEvents"); builder.HasKey(x=>x.Id); builder.Property(x=>x.Provider).IsRequired().HasMaxLength(80); builder.Property(x=>x.EventId).IsRequired().HasMaxLength(200); builder.Property(x=>x.PayloadHash).IsRequired().HasMaxLength(128); builder.HasIndex(x=>new{x.TenantId,x.Provider,x.EventId}).IsUnique(); }
}
