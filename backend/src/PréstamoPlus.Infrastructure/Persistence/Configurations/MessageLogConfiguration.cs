using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class MessageLogConfiguration : IEntityTypeConfiguration<MessageLog>
    {
        public void Configure(EntityTypeBuilder<MessageLog> builder)
        {
            builder.ToTable("MessageLogs");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.TenantId)
                .IsRequired();

            builder.Property(m => m.Tipo)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(m => m.Para)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(m => m.Asunto)
                .IsRequired()
                .HasMaxLength(300);

            builder.Property(m => m.Mensaje)
                .IsRequired();

            builder.Property(m => m.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(m => m.EnviadoEn)
                .IsRequired(false);

            builder.HasIndex(m => m.TenantId);
        }
    }
}
