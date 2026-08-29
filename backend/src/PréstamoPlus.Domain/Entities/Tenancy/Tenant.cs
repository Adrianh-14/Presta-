namespace PréstamoPlus.Domain.Entities.Tenancy
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? RNC { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? LogoUrl { get; set; }
        public decimal CapitalInicial { get; set; }
        public decimal CapitalInicialUsd { get; set; }
        public decimal CapitalInicialEur { get; set; }
        public string MonedaPredeterminada { get; set; } = "DOP";
        public string MonedasHabilitadas { get; set; } = "DOP";
        public string? TipoEmpresa { get; set; }
        public string? ActividadEconomica { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        public string? Provincia { get; set; }
        public string? SitioWeb { get; set; }
        public int? CantidadEmpleados { get; set; }
        public string? RepresentanteTipoIdentificacion { get; set; }
        public string? RepresentanteNumeroIdentificacion { get; set; }
        public string? RepresentanteFotoIdentificacionPath { get; set; }
        public string? RepresentanteFotoPath { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? OnboardingCompletedAt { get; set; }

        public Subscription? Subscription { get; set; }
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
