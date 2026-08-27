namespace PréstamoPlus.Domain.Entities;

public sealed class JournalLine
{
    public Guid Id { get; set; }
    public Guid JournalEntryId { get; set; }
    public Guid LedgerAccountId { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string Description { get; set; } = string.Empty;
    public JournalEntry JournalEntry { get; set; } = null!;
    public LedgerAccount LedgerAccount { get; set; } = null!;
}
