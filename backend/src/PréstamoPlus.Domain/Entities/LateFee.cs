namespace PréstamoPlus.Domain.Entities
{
    public class LateFee
    {
        public Guid Id { get; set; }
        public Guid LoanId { get; set; }
        public decimal Monto { get; set; }
        public int DiasAtraso { get; set; }
        public decimal TasaAplicada { get; set; }
        public DateTime FechaCalculo { get; set; }
        public bool Pagado { get; set; } = false;

        public Loan Loan { get; set; } = null!;
    }
}
