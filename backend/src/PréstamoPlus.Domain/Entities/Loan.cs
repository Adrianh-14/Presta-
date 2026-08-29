using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class Loan
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid ClientId { get; set; }
        public Guid LoanApplicationId { get; set; }
        public decimal MontoOriginal { get; set; }
        public string Moneda { get; set; } = "DOP";
        public decimal TasaInteresAnual { get; set; }
        public int PlazoMeses { get; set; }
        public decimal CuotaMensual { get; set; }
        public decimal SaldoPendiente { get; set; }
        public EstadoPrestamo Estado { get; set; } = EstadoPrestamo.Activo;
        public TipoPrestamo Tipo { get; set; }
        public FrecuenciaPago FrecuenciaPago { get; set; } = FrecuenciaPago.Mensual;
        public DateTime FechaInicio { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Client Client { get; set; } = null!;
        public LoanApplication LoanApplication { get; set; } = null!;
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<Installment> Installments { get; set; } = new List<Installment>();
    }
}
