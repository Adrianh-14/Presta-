namespace PréstamoPlus.Domain.Entities;

public sealed class OutboxMessage
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public int Attempts { get; set; }
    public string? LastError { get; set; }
}
