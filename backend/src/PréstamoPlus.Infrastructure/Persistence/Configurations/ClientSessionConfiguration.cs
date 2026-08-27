using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class ClientSessionConfiguration : IEntityTypeConfiguration<ClientSession>
{
    public void Configure(EntityTypeBuilder<ClientSession> builder)
    {
        builder.ToTable("ClientSessions");
        builder.HasKey(session => session.Id);

        builder.Property(session => session.CreatedAddressHash)
            .HasMaxLength(64);

        builder.HasIndex(session => new { session.TenantId, session.ClientId, session.ExpiresAt });
        builder.HasIndex(session => session.RevokedAt);

        builder.HasOne<Client>()
            .WithMany()
            .HasForeignKey(session => session.ClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
