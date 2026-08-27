namespace PréstamoPlus.Domain.Entities;

public sealed class JobLock
{
    public string Name { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public DateTime LeaseUntil { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
