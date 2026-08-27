using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.DTOs
{
    public record ExpenseDto
    {
        public Guid Id { get; init; }
        public Guid TenantId { get; init; }
        public ExpenseCategory Category { get; init; }
        public string Description { get; init; } = string.Empty;
        public decimal Amount { get; init; }
        public DateTime Date { get; init; }
        public Guid RecordedBy { get; init; }
        public string RecordedByName { get; init; } = string.Empty;
        public string? ReceiptUrl { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record CreateExpenseRequest
    {
        public ExpenseCategory Category { get; init; }
        public string Description { get; init; } = string.Empty;
        public decimal Amount { get; init; }
        public DateTime Date { get; init; }
        public string? ReceiptUrl { get; init; }
    }

    public record UpdateExpenseRequest
    {
        public ExpenseCategory? Category { get; init; }
        public string? Description { get; init; }
        public decimal? Amount { get; init; }
        public DateTime? Date { get; init; }
        public string? ReceiptUrl { get; init; }
    }

    public record FinancialSummaryDto
    {
        public decimal TotalIngresos { get; init; }
        public decimal TotalGastos { get; init; }
        public decimal UtilidadNeta { get; init; }
        public decimal MargenPorcentaje { get; init; }
        public List<ExpenseByCategoryDto> GastosPorCategoria { get; init; } = new();
        public List<MonthlyTrendDto> TendenciaMensual { get; init; } = new();
    }

    public record ExpenseByCategoryDto
    {
        public ExpenseCategory Category { get; init; }
        public decimal Total { get; init; }
        public decimal Porcentaje { get; init; }
    }

    public record MonthlyTrendDto
    {
        public string Mes { get; init; } = string.Empty;
        public decimal Ingresos { get; init; }
        public decimal Gastos { get; init; }
        public decimal Utilidad { get; init; }
    }
}
