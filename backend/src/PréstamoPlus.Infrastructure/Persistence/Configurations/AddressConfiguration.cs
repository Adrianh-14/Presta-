using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Persistence.Configurations
{
    public class AddressConfiguration : IEntityTypeConfiguration<Address>
    {
        public void Configure(EntityTypeBuilder<Address> builder)
        {
            builder.ToTable("Addresses");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Direccion)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(a => a.Ciudad)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.Provincia)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.Sector)
                .HasMaxLength(100);

            builder.Property(a => a.CodigoPostal)
                .HasMaxLength(10);

            builder.HasOne(a => a.Client)
                .WithOne(c => c.Address)
                .HasForeignKey<Address>(a => a.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
