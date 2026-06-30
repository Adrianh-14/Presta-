using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.DTOs
{
    public record DashboardStatsDto
    {
        public decimal TotalPrestado { get; init; }
        public decimal Disponible { get; init; }
        public int EnCartera { get; init; }
        public decimal PorCobrar { get; init; }
        public int SolicitudesPendientes { get; init; }
    }

    public record LoansByMonthDto
    {
        public string Mes { get; init; } = string.Empty;
        public int Cantidad { get; init; }
    }

    public record LoansByTypeDto
    {
        public string Nombre { get; init; } = string.Empty;
        public decimal Valor { get; init; }
    }

    public record PeriodCollectionDto
    {
        public string Frecuencia { get; init; } = string.Empty;
        public string Etiqueta { get; init; } = string.Empty;
        public decimal MontoEstimado { get; init; }
        public int CuotasPendientes { get; init; }
    }

    public record CollectionsDto
    {
        public List<PeriodCollectionDto> Periodos { get; init; } = new();
        public decimal TotalCobranzaPeriodo { get; init; }
    }

    public record ClientDto
    {
        public Guid Id { get; init; }
        public string Nombre { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Telefono { get; init; } = string.Empty;
        public DateTime FechaNacimiento { get; init; }
        public EstadoCivil EstadoCivil { get; init; }
        public EstadoCliente Estado { get; init; }
        public DateTime FechaRegistro { get; init; }
        public WorkInformationDto? WorkInformation { get; init; }
        public AddressDto? Address { get; init; }
        public BankAccountDto? BankAccount { get; init; }
        public List<ReferenceDto> References { get; init; } = new();
        public Guid? TenantId { get; init; }
        public VerificationMediaDto? VerificationMedia { get; init; }
    }

    public record WorkInformationDto
    {
        public string Empresa { get; init; } = string.Empty;
        public string Cargo { get; init; } = string.Empty;
        public decimal Salario { get; init; }
        public int AntiguedadAnios { get; init; }
        public string? DireccionEmpresa { get; init; }
        public string? TelefonoEmpresa { get; init; }
        public TipoEmpleo TipoEmpleo { get; init; }
    }

    public record AddressDto
    {
        public string Direccion { get; init; } = string.Empty;
        public string Ciudad { get; init; } = string.Empty;
        public string Provincia { get; init; } = string.Empty;
        public string? Sector { get; init; }
        public string? CodigoPostal { get; init; }
    }

    public record ReferenceDto
    {
        public string Nombre { get; init; } = string.Empty;
        public RelacionReferencia Relacion { get; init; }
        public string Telefono { get; init; } = string.Empty;
        public string? Email { get; init; }
    }

    public record BankAccountDto
    {
        public string Banco { get; init; } = string.Empty;
        public TipoCuentaBancaria TipoCuenta { get; init; }
        public string NumeroCuenta { get; init; } = string.Empty;
    }

    public record VerificationMediaDto
    {
        public string? VideoPath { get; init; }
        public string? FotoCedulaPath { get; init; }
    }

    public record LoanApplicationDto
    {
        public Guid Id { get; init; }
        public decimal MontoSolicitado { get; init; }
        public decimal TasaInteresMensual { get; init; }
        public int Plazo { get; init; }
        public UnidadPlazo UnidadPlazo { get; init; }
        public FrecuenciaPago FrecuenciaPago { get; init; }
        public decimal GastoCierrePorcentaje { get; init; }
        public decimal CuotaEstimada { get; init; }
        public decimal TotalPagar { get; init; }
        public decimal TotalIntereses { get; init; }
        public EstadoSolicitud Estado { get; init; }
        public TipoPrestamo TipoPrestamo { get; init; }
        public DateTime FechaSolicitud { get; init; }
        public ClientDto Client { get; init; } = null!;
        public WorkInformationDto? WorkInformation { get; init; }
        public AddressDto? Address { get; init; }
        public List<ReferenceDto> References { get; init; } = new();
        public BankAccountDto? BankAccount { get; init; }
        public VerificationMediaDto? VerificationMedia { get; init; }
    }

    public record CreateSolicitudRequest
    {
        public Guid? TenantId { get; init; }
        public ClientDto Client { get; init; } = null!;
        public WorkInformationDto WorkInformation { get; init; } = null!;
        public AddressDto Address { get; init; } = null!;
        public List<ReferenceDto> References { get; init; } = new();
        public BankAccountDto BankAccount { get; init; } = null!;
        public VerificationMediaDto? VerificationMedia { get; init; }
        public decimal MontoSolicitado { get; init; }
        public decimal TasaInteresMensual { get; init; }
        public int Plazo { get; init; }
        public UnidadPlazo UnidadPlazo { get; init; }
        public FrecuenciaPago FrecuenciaPago { get; init; }
        public decimal GastoCierrePorcentaje { get; init; }
        public TipoPrestamo TipoPrestamo { get; init; }
    }

    public record LoanDto
    {
        public Guid Id { get; init; }
        public Guid ClientId { get; init; }
        public string Cliente { get; init; } = string.Empty;
        public decimal Monto { get; init; }
        public decimal Tasa { get; init; }
        public int Plazo { get; init; }
        public decimal CuotaMensual { get; init; }
        public decimal SaldoPendiente { get; init; }
        public EstadoPrestamo Estado { get; init; }
        public TipoPrestamo Tipo { get; init; }
        public FrecuenciaPago FrecuenciaPago { get; init; }
        public DateTime FechaInicio { get; init; }
        public DateTime FechaVencimiento { get; init; }
    }

    public record UpdateEstadoRequest
    {
        public EstadoSolicitud Estado { get; init; }
        public DateTime? FechaInicio { get; init; }
    }

    public record AmortizationRowDto
    {
        public int Numero { get; init; }
        public DateTime FechaPago { get; init; }
        public decimal Cuota { get; init; }
        public decimal Capital { get; init; }
        public decimal Interes { get; init; }
        public decimal SaldoInicial { get; init; }
        public decimal SaldoFinal { get; init; }
        public string Estado { get; init; } = string.Empty;
    }
}
