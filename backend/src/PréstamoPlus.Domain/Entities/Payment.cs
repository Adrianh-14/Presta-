namespace PréstamoPlus.Domain.Entities
{
    public class Payment
    {
        public Guid Id { get; set; }
        public Guid LoanId { get; set; }
        public decimal Monto { get; set; }
        public decimal Capital { get; set; }
        public decimal Interes { get; set; }
        public decimal MoraPagada { get; set; }
        public decimal SaldoRestante { get; set; }
        public DateTime FechaPago { get; set; } = DateTime.UtcNow;
        public Enums.MetodoPago MetodoPago { get; set; }
        public string? ReferenciaExterna { get; set; }
        public string? Notas { get; set; }

        public Loan Loan { get; set; } = null!;
    }
}
