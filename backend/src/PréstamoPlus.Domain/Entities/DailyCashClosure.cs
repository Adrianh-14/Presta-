namespace PréstamoPlus.Domain.Entities;

public sealed class DailyCashClosure
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateOnly BusinessDate { get; set; }
    public decimal ExpectedBalance { get; set; }
    public decimal CountedBalance { get; set; }
    public decimal Difference { get; set; }
    public Guid ClosedBy { get; set; }
    public DateTime ClosedAt { get; set; } = DateTime.UtcNow;
    public bool IsReopened { get; set; }
    public Guid? ReopenedBy { get; set; }
    public DateTime? ReopenedAt { get; set; }
    public string? ReopenReason { get; set; }
}
