using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class PaymentQR
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public Guid AssignmentId { get; set; }
        public Guid CollectorId { get; set; }
        public Guid LoanId { get; set; }
        public Guid ClientId { get; set; }
        public decimal Monto { get; set; }
        public DateTime ExpiresAt { get; set; }
        public PaymentQRStatus Status { get; set; } = PaymentQRStatus.Pending;
        public DateTime? UsedAt { get; set; }
        public double? Latitud { get; set; }
        public double? Longitud { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CollectionAssignment Assignment { get; set; } = null!;
        public Collector Collector { get; set; } = null!;
        public Loan Loan { get; set; } = null!;
        public Client Client { get; set; } = null!;
    }
}
