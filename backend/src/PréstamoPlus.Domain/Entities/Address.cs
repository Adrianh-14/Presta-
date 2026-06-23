namespace PréstamoPlus.Domain.Entities
{
    public class Address
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string Direccion { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string Provincia { get; set; } = string.Empty;
        public string? Sector { get; set; }
        public string? CodigoPostal { get; set; }

        public Client Client { get; set; } = null!;
    }
}
