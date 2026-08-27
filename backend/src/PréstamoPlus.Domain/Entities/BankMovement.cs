namespace PréstamoPlus.Domain.Entities;

public sealed class BankMovement
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid CashAccountId { get; set; }
    public DateTime OccurredAt { get; set; }
    public decimal Amount { get; set; }
    public bool IsCredit { get; set; }
    public string ExternalReference { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsReconciled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public CashAccount CashAccount { get; set; } = null!;
}
