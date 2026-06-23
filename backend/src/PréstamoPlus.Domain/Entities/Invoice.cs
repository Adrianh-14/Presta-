namespace PréstamoPlus.Domain.Entities
{
    public class Invoice
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid LoanId { get; set; }
        public string Numero { get; set; } = null!;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public decimal Subtotal { get; set; }
        public decimal MoraTotal { get; set; }
        public decimal Total { get; set; }
        public string? PdfPath { get; set; }
        public DateTime? EnviadoEn { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Loan Loan { get; set; } = null!;
    }
}
