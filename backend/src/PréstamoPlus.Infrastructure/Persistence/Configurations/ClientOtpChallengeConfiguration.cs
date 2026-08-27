using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations;

public sealed class ClientOtpChallengeConfiguration : IEntityTypeConfiguration<ClientOtpChallenge>
{
    public void Configure(EntityTypeBuilder<ClientOtpChallenge> builder)
    {
        builder.ToTable("ClientOtpChallenges");
        builder.HasKey(challenge => challenge.Id);

        builder.Property(challenge => challenge.CodeHash)
            .IsRequired()
            .HasMaxLength(64);
        builder.Property(challenge => challenge.IdentifierHash)
            .IsRequired()
            .HasMaxLength(64);
        builder.Property(challenge => challenge.RequestAddressHash)
            .HasMaxLength(64);

        builder.HasIndex(challenge => new { challenge.TenantId, challenge.ClientId, challenge.CreatedAt });
        builder.HasIndex(challenge => challenge.ExpiresAt);

        builder.HasOne<Client>()
            .WithMany()
            .HasForeignKey(challenge => challenge.ClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
