namespace PréstamoPlus.Domain.Entities;

public sealed class LocationConsentEvidence
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClientId { get; set; }
    public Guid? LoanId { get; set; }
    public string Purpose { get; set; } = "Visita de cobro";
    public string Scope { get; set; } = "Ubicación temporal durante una visita activa";
    public string TermsVersion { get; set; } = string.Empty;
    public string ConsentTextHash { get; set; } = string.Empty;
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DeviceId { get; set; }
}
