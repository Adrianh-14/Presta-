using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Expenses.Queries.GetExpenses
{
    public record GetExpensesQuery(Guid TenantId, DateTime? From, DateTime? To, string? Category) : IRequest<List<ExpenseDto>>;

    public class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, List<ExpenseDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetExpensesQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<ExpenseDto>> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
        {
            var expenses = await _unitOfWork.Expenses.ListAsync(cancellationToken);
            var filtered = expenses.Where(e => e.TenantId == request.TenantId);

            if (request.From.HasValue)
                filtered = filtered.Where(e => e.Date >= request.From.Value);

            if (request.To.HasValue)
                filtered = filtered.Where(e => e.Date <= request.To.Value.AddDays(1));

            if (!string.IsNullOrEmpty(request.Category) && Enum.TryParse<Domain.Enums.ExpenseCategory>(request.Category, true, out var cat))
                filtered = filtered.Where(e => e.Category == cat);

            var result = new List<ExpenseDto>();
            foreach (var expense in filtered.OrderByDescending(e => e.Date))
            {
                var user = await _unitOfWork.Users.GetByIdAsync(expense.RecordedBy);
                result.Add(new ExpenseDto
                {
                    Id = expense.Id,
                    TenantId = expense.TenantId,
                    Category = expense.Category,
                    Description = expense.Description,
                    Amount = expense.Amount,
                    Date = expense.Date,
                    RecordedBy = expense.RecordedBy,
                    RecordedByName = user?.Nombre ?? "",
                    ReceiptUrl = expense.ReceiptUrl,
                    CreatedAt = expense.CreatedAt
                });
            }

            return result;
        }
    }
}
