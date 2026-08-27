using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class CollectionVisitConfiguration : IEntityTypeConfiguration<CollectionVisit>
    {
        public void Configure(EntityTypeBuilder<CollectionVisit> builder)
        {
            builder.ToTable("CollectionVisits");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.AssignmentId).IsRequired();

            builder.Property(v => v.CollectorId).IsRequired();

            builder.Property(v => v.LoanId).IsRequired();

            builder.Property(v => v.TipoVisita)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(v => v.MontoRecibido).HasColumnType("decimal(18,2)");

            builder.Property(v => v.Notas).HasMaxLength(500);

            builder.Property(v => v.FotoUrl).HasMaxLength(500);

            builder.HasIndex(v => v.AssignmentId);

            builder.HasIndex(v => v.CollectorId);

            builder.HasOne(v => v.Assignment)
                .WithMany(a => a.Visits)
                .HasForeignKey(v => v.AssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.Collector)
                .WithMany(c => c.Visits)
                .HasForeignKey(v => v.CollectorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.Loan)
                .WithMany()
                .HasForeignKey(v => v.LoanId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
