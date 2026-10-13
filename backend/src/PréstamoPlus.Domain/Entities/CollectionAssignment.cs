using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class CollectionAssignment
    {
        public Guid Id { get; set; }
        public Guid CollectorId { get; set; }
        public Guid LoanId { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public Guid AssignedBy { get; set; }
        public EstadoAsignacion Estado { get; set; } = EstadoAsignacion.Asignado;
        public bool IsQRAuthorized { get; set; } = false;
        public int QRGenerationAttempts { get; set; } = 0;
        public bool QRPermissionRequested { get; set; } = false;
        // Cuotas autorizadas explícitamente por administración (números separados por coma).
        public string AuthorizedQRInstallments { get; set; } = string.Empty;

        public Collector Collector { get; set; } = null!;
        public Loan Loan { get; set; } = null!;
        public User AssignedByUser { get; set; } = null!;
        public ICollection<CollectionVisit> Visits { get; set; } = new List<CollectionVisit>();
    }
}
