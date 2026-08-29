using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class LoanApplication
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid ClientId { get; set; }
        public decimal MontoSolicitado { get; set; }
        public string Moneda { get; set; } = "DOP";
        public decimal TasaInteresMensual { get; set; }
        public int Plazo { get; set; }
        public UnidadPlazo UnidadPlazo { get; set; }
        public FrecuenciaPago FrecuenciaPago { get; set; }
        public decimal GastoCierrePorcentaje { get; set; }
        public decimal CuotaEstimada { get; set; }
        public decimal TotalPagar { get; set; }
        public decimal TotalIntereses { get; set; }
        public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Pendiente;
        public TipoPrestamo TipoPrestamo { get; set; } = TipoPrestamo.Personal;
        public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
        public Guid? FirstApprovedBy { get; set; }
        public DateTime? FirstApprovedAt { get; set; }
        public Guid? SecondApprovedBy { get; set; }
        public DateTime? SecondApprovedAt { get; set; }

        public Client Client { get; set; } = null!;
        public VerificationMedia? VerificationMedia { get; set; }
        public Loan? Loan { get; set; }
    }
}
