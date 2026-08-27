using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class Expense
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public ExpenseCategory Category { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public Guid RecordedBy { get; set; }
        public string? ReceiptUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User RecordedByUser { get; set; } = null!;
        public Tenancy.Tenant Tenant { get; set; } = null!;
    }
}
