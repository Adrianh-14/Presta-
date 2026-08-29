using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities.Tenancy;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations.Tenancy
{
    public class TenantConfigConfiguration : IEntityTypeConfiguration<TenantConfig>
    {
        public void Configure(EntityTypeBuilder<TenantConfig> builder)
        {
            builder.ToTable("TenantConfigs");

            builder.HasKey(tc => tc.Id);

            builder.Property(tc => tc.CapitalInicial)
                .IsRequired()
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);

            builder.Property(tc => tc.TasaMoraDiaria)
                .IsRequired()
                .HasColumnType("decimal(5,4)")
                .HasDefaultValue(0.05m);

            builder.Property(tc => tc.DiasGracia)
                .IsRequired()
                .HasDefaultValue(3);

            builder.Property(tc => tc.TelefonoWhatsApp)
                .HasMaxLength(20);

            builder.Property(tc => tc.EmailFrom)
                .HasMaxLength(200);

            builder.HasOne(tc => tc.Tenant)
                .WithMany()
                .HasForeignKey(tc => tc.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
