namespace PréstamoPlus.Domain.Entities
{
    public class WorkInformation
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string Empresa { get; set; } = string.Empty;
        public string Cargo { get; set; } = string.Empty;
        public decimal Salario { get; set; }
        public int AntiguedadAnios { get; set; }
        public string? DireccionEmpresa { get; set; }
        public string? TelefonoEmpresa { get; set; }
        public Enums.TipoEmpleo TipoEmpleo { get; set; }

        public Client Client { get; set; } = null!;
    }
}
