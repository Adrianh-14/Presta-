using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Payments.Queries.GetPaymentsByLoanId
{
    public record GetPaymentsByLoanIdQuery(Guid LoanId) : IRequest<IReadOnlyList<PaymentDto>>;
}
