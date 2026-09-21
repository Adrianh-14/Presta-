namespace PréstamoPlus.Domain.Entities;

public sealed class EmailVerificationCode
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public int FailedAttempts { get; set; }
}
