namespace PréstamoPlus.Domain.Entities;

public class ClientOtpChallenge
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ClientId { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public string IdentifierHash { get; set; } = string.Empty;
    public string? RequestAddressHash { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
