using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class CollectionVisit
    {
        public Guid Id { get; set; }
        public Guid AssignmentId { get; set; }
        public Guid CollectorId { get; set; }
        public Guid LoanId { get; set; }
        public TipoVisita TipoVisita { get; set; }
        public decimal MontoRecibido { get; set; }
        public string? Notas { get; set; }
        public double? Latitud { get; set; }
        public double? Longitud { get; set; }
        public string? FotoUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CollectionAssignment Assignment { get; set; } = null!;
        public Collector Collector { get; set; } = null!;
        public Loan Loan { get; set; } = null!;
    }
}
