using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class ReferenceConfiguration : IEntityTypeConfiguration<Reference>
    {
        public void Configure(EntityTypeBuilder<Reference> builder)
        {
            builder.ToTable("References");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Nombre)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(r => r.Relacion)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(r => r.Telefono)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(r => r.Email)
                .HasMaxLength(200);

            builder.HasOne(r => r.Client)
                .WithMany(c => c.References)
                .HasForeignKey(r => r.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
