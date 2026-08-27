using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class VerificationMediaConfiguration : IEntityTypeConfiguration<VerificationMedia>
    {
        public void Configure(EntityTypeBuilder<VerificationMedia> builder)
        {
            builder.ToTable("VerificationMedia");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.VideoPath)
                .HasMaxLength(500);

            builder.Property(v => v.FotoCedulaPath)
                .HasMaxLength(500);

            builder.HasOne(v => v.LoanApplication)
                .WithOne(l => l.VerificationMedia)
                .HasForeignKey<VerificationMedia>(v => v.LoanApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(v => v.Client)
                .WithOne(c => c.VerificationMedia)
                .HasForeignKey<VerificationMedia>(v => v.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.ToTable(t => t.HasCheckConstraint(
                "CK_VerificationMedia_Owner",
                "(\"LoanApplicationId\" IS NOT NULL AND \"ClientId\" IS NULL) OR (\"LoanApplicationId\" IS NULL AND \"ClientId\" IS NOT NULL)"));
        }
    }
}
