using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Payload).IsRequired();
        builder.Property(x => x.LastError).HasMaxLength(2000);
        builder.HasIndex(x => new { x.ProcessedAt, x.NextAttemptAt });
    }
}

public sealed class JobLockConfiguration : IEntityTypeConfiguration<JobLock>
{
    public void Configure(EntityTypeBuilder<JobLock> builder)
    {
        builder.ToTable("JobLocks");
        builder.HasKey(x => x.Name);
        builder.Property(x => x.Name).HasMaxLength(120);
        builder.Property(x => x.Owner).IsRequired().HasMaxLength(120);
    }
}
