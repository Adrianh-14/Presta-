using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Expenses.Commands.UpdateExpense
{
    public record UpdateExpenseCommand(Guid Id, UpdateExpenseRequest Request, Guid TenantId) : IRequest<ExpenseDto>;

    public class UpdateExpenseCommandHandler : IRequestHandler<UpdateExpenseCommand, ExpenseDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateExpenseCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ExpenseDto> Handle(UpdateExpenseCommand request, CancellationToken cancellationToken)
        {
            var expense = await _unitOfWork.Expenses.GetByIdAsync(request.Id);
            if (expense is null || expense.TenantId != request.TenantId)
                throw new InvalidOperationException("Gasto no encontrado.");

            var req = request.Request;

            if (req.Category.HasValue) expense.Category = req.Category.Value;
            if (req.Description is not null) expense.Description = req.Description;
            if (req.Amount.HasValue) expense.Amount = req.Amount.Value;
            if (req.Date.HasValue) expense.Date = DateTime.SpecifyKind(req.Date.Value, DateTimeKind.Utc);
            if (req.ReceiptUrl is not null) expense.ReceiptUrl = req.ReceiptUrl;

            await _unitOfWork.Expenses.UpdateAsync(expense, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var user = await _unitOfWork.Users.GetByIdAsync(expense.RecordedBy);

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
