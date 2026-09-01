namespace PréstamoPlus.Domain.Entities;

public sealed class LocationAccessAudit
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid SessionId { get; set; }
    public Guid ViewerUserId { get; set; }
    public string Action { get; set; } = "Viewed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
