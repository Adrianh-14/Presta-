using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class Client
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Cedula { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public DateTime FechaNacimiento { get; set; }
        public EstadoCivil EstadoCivil { get; set; }
        public EstadoCliente Estado { get; set; } = EstadoCliente.Activo;
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
        public DateTime? DataConsentAt { get; set; }
        public DateTime? CreditEvaluationConsentAt { get; set; }
        public DateTime? CommunicationsConsentAt { get; set; }

        public WorkInformation? WorkInformation { get; set; }
        public Address? Address { get; set; }
        public BankAccount? BankAccount { get; set; }
        public VerificationMedia? VerificationMedia { get; set; }
        public ICollection<Reference> References { get; set; } = new List<Reference>();
        public ICollection<LoanApplication> LoanApplications { get; set; } = new List<LoanApplication>();
    }
}
