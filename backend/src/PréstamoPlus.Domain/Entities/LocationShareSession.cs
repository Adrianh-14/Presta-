namespace PréstamoPlus.Domain.Entities;

public sealed class LocationShareSession
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClientId { get; set; }
    public Guid LoanId { get; set; }
    public Guid CollectorId { get; set; }
    public Guid ConsentId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string Status { get; set; } = "Active";
    public double? LastLatitude { get; set; }
    public double? LastLongitude { get; set; }
    public double? LastAccuracy { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
}
