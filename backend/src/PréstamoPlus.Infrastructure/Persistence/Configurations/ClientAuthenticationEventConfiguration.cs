using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class ClientAuthenticationEventConfiguration : IEntityTypeConfiguration<ClientAuthenticationEvent>
{
    public void Configure(EntityTypeBuilder<ClientAuthenticationEvent> builder)
    {
        builder.ToTable("ClientAuthenticationEvents");
        builder.HasKey(authenticationEvent => authenticationEvent.Id);

        builder.Property(authenticationEvent => authenticationEvent.EventType)
            .IsRequired()
            .HasMaxLength(64);
        builder.Property(authenticationEvent => authenticationEvent.Outcome)
            .IsRequired()
            .HasMaxLength(32);
        builder.Property(authenticationEvent => authenticationEvent.IdentifierHash)
            .IsRequired()
            .HasMaxLength(64);
        builder.Property(authenticationEvent => authenticationEvent.RemoteAddressHash)
            .HasMaxLength(64);

        builder.HasIndex(authenticationEvent => authenticationEvent.CreatedAt);
        builder.HasIndex(authenticationEvent => new
        {
            authenticationEvent.TenantId,
            authenticationEvent.ClientId,
            authenticationEvent.CreatedAt
        });
    }
}
