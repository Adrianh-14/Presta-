namespace PréstamoPlus.Domain.Entities;

public class ClientAuthenticationEvent
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? ClientId { get; set; }
    public Guid? ChallengeId { get; set; }
    public Guid? SessionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public string IdentifierHash { get; set; } = string.Empty;
    public string? RemoteAddressHash { get; set; }
    public DateTime CreatedAt { get; set; }
}
