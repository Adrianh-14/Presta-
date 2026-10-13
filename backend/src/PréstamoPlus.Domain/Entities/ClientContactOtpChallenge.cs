namespace PréstamoPlus.Domain.Entities;

public sealed class ClientContactOtpChallenge
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClientId { get; set; }
    public string Purpose { get; set; } = "";
    public string ValueHash { get; set; } = "";
    public string CodeHash { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
