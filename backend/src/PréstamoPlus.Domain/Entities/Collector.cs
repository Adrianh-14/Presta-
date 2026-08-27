namespace PréstamoPlus.Domain.Entities
{
    public class Collector
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid UserId { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Zona { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? PhotoUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Tenancy.Tenant Tenant { get; set; } = null!;
        public ICollection<CollectionAssignment> Assignments { get; set; } = new List<CollectionAssignment>();
        public ICollection<CollectionVisit> Visits { get; set; } = new List<CollectionVisit>();
    }
}
