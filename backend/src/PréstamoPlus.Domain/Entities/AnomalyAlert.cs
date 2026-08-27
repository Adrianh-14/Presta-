namespace PréstamoPlus.Domain.Entities;

public sealed class AnomalyAlert
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public string Evidence { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    public bool Reviewed { get; set; }
}
