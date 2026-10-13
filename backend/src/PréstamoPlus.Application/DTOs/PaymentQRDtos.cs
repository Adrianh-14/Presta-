using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.DTOs
{
    public record PaymentQRDto
    {
        public Guid Id { get; init; }
        public string Token { get; init; } = string.Empty;
        public string ClienteNombre { get; init; } = string.Empty;
        public string ClienteCedula { get; init; } = string.Empty;
        public decimal Monto { get; init; }
        public int NumeroCuota { get; init; }
        public string Moneda { get; init; } = "DOP";
        public DateTime ExpiresAt { get; init; }
        public PaymentQRStatus Status { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record GeneratePaymentQRRequest
    {
        public Guid AssignmentId { get; init; }
        public int InstallmentNumber { get; init; }
        public decimal Monto { get; init; }
        public string? Moneda { get; init; }
    }

    public record ProcessPaymentQRRequest
    {
        public string Token { get; init; } = string.Empty;
        public double? Latitud { get; init; }
        public double? Longitud { get; init; }
    }

    public record PaymentQRProcessResult
    {
        public bool Success { get; init; }
        public Guid? PaymentId { get; init; }
        public string Message { get; init; } = string.Empty;
        public decimal Monto { get; init; }
        public string Moneda { get; init; } = "DOP";
        public decimal Capital { get; init; }
        public decimal Interes { get; init; }
        public decimal Mora { get; init; }
        public string CuotasAplicadas { get; init; } = string.Empty;
        public int TotalCuotas { get; init; }
        public DateTime Fecha { get; init; }
        public string ClienteNombre { get; init; } = string.Empty;
        public decimal SaldoRestante { get; init; }
    }

    public record QRPaymentInfoDto
    {
        public Guid AssignmentId { get; init; }
        public string ClienteNombre { get; init; } = string.Empty;
        public string ClienteCedula { get; init; } = string.Empty;
        public string ClienteTelefono { get; init; } = string.Empty;
        public string CollectorNombre { get; init; } = string.Empty;
        public string PrestamoId { get; init; } = string.Empty;
        public decimal Monto { get; init; }
        public int NumeroCuota { get; init; }
        public string Moneda { get; init; } = "DOP";
        public decimal SaldoPendiente { get; init; }
        public DateTime ExpiresAt { get; init; }
        public PaymentQRStatus Status { get; init; }
        public string EstadoMensaje { get; init; } = string.Empty;
        public Guid? PaymentId { get; init; }
        public decimal CapitalAplicado { get; init; }
        public decimal InteresAplicado { get; init; }
        public decimal MoraAplicada { get; init; }
        public decimal SaldoRestante { get; init; }
        public DateTime? FechaPago { get; init; }
        public string CuotasAplicadas { get; init; } = string.Empty;
        public int TotalCuotas { get; init; }
    }

    public record QRRequestOtpRequest
    {
        public string Token { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
    }

    public record QRVerifyOtpRequest
    {
        public string Token { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
        public Guid ChallengeId { get; init; }
        public string Code { get; init; } = string.Empty;
        public double? Latitud { get; init; }
        public double? Longitud { get; init; }
    }
}
