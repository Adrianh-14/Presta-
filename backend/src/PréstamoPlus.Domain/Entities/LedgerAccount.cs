namespace PréstamoPlus.Domain.Entities;

public sealed class LedgerAccount
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "DOP";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<JournalLine> Lines { get; set; } = new List<JournalLine>();
}
