namespace PréstamoPlus.Domain.Entities;

public sealed class CashAccount
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "DOP";
    public bool IsBank { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<BankMovement> Movements { get; set; } = new List<BankMovement>();
}
