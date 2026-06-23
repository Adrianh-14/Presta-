namespace PréstamoPlus.Domain.Entities
{
    public class Reference
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public Enums.RelacionReferencia Relacion { get; set; }
        public string Telefono { get; set; } = string.Empty;
        public string? Email { get; set; }

        public Client Client { get; set; } = null!;
    }
}
