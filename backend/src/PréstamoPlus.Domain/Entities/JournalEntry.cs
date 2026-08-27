namespace PréstamoPlus.Domain.Entities;

public sealed class JournalEntry
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public Guid SourceId { get; set; }
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;
    public string Hash { get; set; } = string.Empty;
    public ICollection<JournalLine> Lines { get; set; } = new List<JournalLine>();
}
