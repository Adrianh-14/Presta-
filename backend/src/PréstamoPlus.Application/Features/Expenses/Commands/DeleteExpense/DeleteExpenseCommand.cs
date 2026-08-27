using MediatR;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Expenses.Commands.DeleteExpense
{
    public record DeleteExpenseCommand(Guid Id, Guid TenantId) : IRequest<bool>;

    public class DeleteExpenseCommandHandler : IRequestHandler<DeleteExpenseCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteExpenseCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(DeleteExpenseCommand request, CancellationToken cancellationToken)
        {
            var expense = await _unitOfWork.Expenses.GetByIdAsync(request.Id);
            if (expense is null || expense.TenantId != request.TenantId) return false;

            await _unitOfWork.Expenses.DeleteAsync(expense, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
