using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary
{
    public record GetPaymentSummaryQuery(Guid LoanId) : IRequest<PaymentSummaryDto?>;
}
