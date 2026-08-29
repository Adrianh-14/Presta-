using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.DTOs
{
    public record PaymentDto
    {
        public Guid Id { get; init; }
        public Guid LoanId { get; init; }
        public decimal Monto { get; init; }
        public string Moneda { get; init; } = "DOP";
        public decimal Capital { get; init; }
        public decimal Interes { get; init; }
        public decimal MoraPagada { get; init; }
        public decimal SaldoRestante { get; init; }
        public DateTime FechaPago { get; init; }
        public MetodoPago MetodoPago { get; init; }
        public string? ReferenciaExterna { get; init; }
        public string? Notas { get; init; }
        public string? IdempotencyKey { get; init; }
    }

    public record CreatePaymentRequest
    {
        public Guid LoanId { get; init; }
        public decimal Monto { get; init; }
        public string? Moneda { get; init; }
        public string MetodoPago { get; init; } = "transferencia";
        public string? ReferenciaExterna { get; init; }
        public string? Notas { get; init; }
        public string? IdempotencyKey { get; init; }
    }

    public record CreateMoraPaymentRequest
    {
        public Guid LoanId { get; init; }
        public Guid LateFeeId { get; init; }
        public decimal Monto { get; init; }
        public string? Moneda { get; init; }
        public string MetodoPago { get; init; } = "transferencia";
        public string? ReferenciaExterna { get; init; }
        public string? Notas { get; init; }
        public string? IdempotencyKey { get; init; }
    }

    public record PaymentSummaryDto
    {
        public decimal TotalPagado { get; init; }
        public decimal TotalCapital { get; init; }
        public decimal TotalIntereses { get; init; }
        public decimal TotalMora { get; init; }
        public decimal MoraPendiente { get; init; }
        public decimal CuotaBase { get; init; }
        public decimal CuotaConMora { get; init; }
        public int DiasMora { get; init; }
        public decimal SaldoPendiente { get; init; }
        public int TotalPagos { get; init; }
        public DateTime? ProximoPago { get; init; }
    }
}
