using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class Installment
    {
        public Guid Id { get; set; }
        public Guid LoanId { get; set; }
        public int Numero { get; set; }
        public DateTime FechaPago { get; set; }
        public decimal Capital { get; set; }
        public decimal Interes { get; set; }
        public decimal Cuota { get; set; }
        public decimal CapitalPagado { get; set; }
        public decimal InteresPagado { get; set; }
        public decimal MoraPagada { get; set; }
        public EstadoInstallment Estado { get; set; } = EstadoInstallment.Pendiente;

        public Loan Loan { get; set; } = null!;
    }
}
