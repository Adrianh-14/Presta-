using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.DTOs
{
    public record CollectorDto
    {
        public Guid Id { get; init; }
        public Guid UserId { get; init; }
        public string Nombre { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
        public string Telefono { get; init; } = string.Empty;
        public string Zona { get; init; } = string.Empty;
        public bool IsActive { get; init; }
        public string? PhotoUrl { get; init; }
        public int TotalAsignados { get; init; }
        public int CobrosExitosos { get; init; }
        public decimal MontoCobrado { get; init; }
        public int TotalVisitas { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record CreateCollectorRequest
    {
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public string Nombre { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
        public string Telefono { get; init; } = string.Empty;
        public string Zona { get; init; } = string.Empty;
    }

    public record UpdateCollectorRequest
    {
        public string? Nombre { get; init; }
        public string? Telefono { get; init; }
        public string? Zona { get; init; }
        public string? PhotoUrl { get; init; }
    }

    public record CollectionAssignmentDto
    {
        public Guid Id { get; init; }
        public Guid CollectorId { get; init; }
        public Guid LoanId { get; init; }
        public string ClienteNombre { get; init; } = string.Empty;
        public string ClienteCedula { get; init; } = string.Empty;
        public string ClienteTelefono { get; init; } = string.Empty;
        public decimal MontoOriginal { get; init; }
        public decimal CuotaMensual { get; init; }
        public decimal SaldoPendiente { get; init; }
        public FrecuenciaPago Frecuencia { get; init; }
        public EstadoPrestamo EstadoPrestamo { get; init; }
        public EstadoAsignacion Estado { get; init; }
        public bool IsQRAuthorized { get; init; }
        public int QRGenerationAttempts { get; init; }
        public bool QRPermissionRequested { get; init; }
        public DateTime AssignedAt { get; init; }
        public DateTime? UltimaVisita { get; init; }
        public TipoVisita? UltimoResultado { get; init; }
    }

    public record AssignLoansRequest
    {
        public List<Guid> LoanIds { get; init; } = new();
    }

    public record CollectionVisitDto
    {
        public Guid Id { get; init; }
        public Guid AssignmentId { get; init; }
        public Guid CollectorId { get; init; }
        public Guid LoanId { get; init; }
        public string ClienteNombre { get; init; } = string.Empty;
        public TipoVisita TipoVisita { get; init; }
        public decimal MontoRecibido { get; init; }
        public string? Notas { get; init; }
        public double? Latitud { get; init; }
        public double? Longitud { get; init; }
        public string? FotoUrl { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record RecordVisitRequest
    {
        public TipoVisita TipoVisita { get; init; }
        public decimal MontoRecibido { get; init; }
        public string? Notas { get; init; }
        public double? Latitud { get; init; }
        public double? Longitud { get; init; }
        public string? FotoUrl { get; init; }
    }

    public record CollectorDashboardDto
    {
        public string CollectorNombre { get; init; } = string.Empty;
        public string Zona { get; init; } = string.Empty;
        public int TotalAsignados { get; init; }
        public int CobrosExitosos { get; init; }
        public int CobrosParciales { get; init; }
        public int SinResultado { get; init; }
        public decimal MontoCobrado { get; init; }
        public decimal MontoPendiente { get; init; }
        public List<CollectionAssignmentDto> Asignaciones { get; init; } = new();
    }
}
