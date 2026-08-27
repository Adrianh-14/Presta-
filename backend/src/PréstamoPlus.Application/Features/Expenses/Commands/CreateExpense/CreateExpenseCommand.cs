using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Expenses.Commands.CreateExpense
{
    public record CreateExpenseCommand(CreateExpenseRequest Request, Guid TenantId, Guid RecordedBy) : IRequest<ExpenseDto>;

    public class CreateExpenseCommandHandler : IRequestHandler<CreateExpenseCommand, ExpenseDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateExpenseCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ExpenseDto> Handle(CreateExpenseCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;

            var expense = new Expense
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                Category = req.Category,
                Description = req.Description,
                Amount = req.Amount,
                Date = DateTime.SpecifyKind(req.Date, DateTimeKind.Utc),
                RecordedBy = request.RecordedBy,
                ReceiptUrl = req.ReceiptUrl,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Expenses.AddAsync(expense, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var user = await _unitOfWork.Users.GetByIdAsync(request.RecordedBy);

            return new ExpenseDto
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
            };
        }
    }
}
