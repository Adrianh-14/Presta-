using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class CollectionAssignmentConfiguration : IEntityTypeConfiguration<CollectionAssignment>
    {
        public void Configure(EntityTypeBuilder<CollectionAssignment> builder)
        {
            builder.ToTable("CollectionAssignments");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.CollectorId).IsRequired();

            builder.Property(a => a.LoanId).IsRequired();

            builder.Property(a => a.AssignedAt).IsRequired();

            builder.Property(a => a.AssignedBy).IsRequired();

            builder.Property(a => a.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(a => a.IsQRAuthorized).HasDefaultValue(false);

            builder.HasIndex(a => new { a.CollectorId, a.LoanId });

            builder.HasOne(a => a.Collector)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.CollectorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Loan)
                .WithMany()
                .HasForeignKey(a => a.LoanId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.AssignedByUser)
                .WithMany()
                .HasForeignKey(a => a.AssignedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
