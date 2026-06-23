using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities.Tenancy;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations.Tenancy
{
    public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
    {
        public void Configure(EntityTypeBuilder<Subscription> builder)
        {
            builder.ToTable("Subscriptions");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.PlanId)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(s => s.StripeCustomerId)
                .HasMaxLength(100);

            builder.Property(s => s.StripeSubscriptionId)
                .HasMaxLength(100);

            builder.HasOne(s => s.Tenant)
                .WithOne(t => t.Subscription)
                .HasForeignKey<Subscription>(s => s.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
