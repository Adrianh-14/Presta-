using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary
{
    public class GetPaymentSummaryQueryHandler : IRequestHandler<GetPaymentSummaryQuery, PaymentSummaryDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPaymentSummaryQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PaymentSummaryDto?> Handle(GetPaymentSummaryQuery request, CancellationToken cancellationToken)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(request.LoanId);
            if (loan is null) return null;

            var spec = new PaymentsByLoanIdSpec(request.LoanId);
            var payments = await _unitOfWork.Payments.ListAsync(spec, cancellationToken);

            var unpaidMoraSpec = new UnpaidLateFeesByLoanIdSpec(request.LoanId);
            var unpaidLateFees = await _unitOfWork.LateFees.ListAsync(unpaidMoraSpec, cancellationToken);

            decimal totalPagado = payments.Sum(p => p.Monto);
            decimal totalCapital = payments.Sum(p => p.Capital);
            decimal totalIntereses = payments.Sum(p => p.Interes);
            decimal totalMora = payments.Sum(p => p.MoraPagada);

            DateTime? proximoPago = loan.Estado != EstadoPrestamo.Pagado ? DateTime.UtcNow.AddDays(30) : null;

            return new PaymentSummaryDto
            {
                TotalPagado = totalPagado,
                TotalCapital = totalCapital,
                TotalIntereses = totalIntereses,
                TotalMora = totalMora,
                SaldoPendiente = loan.SaldoPendiente,
                TotalPagos = payments.Count,
                ProximoPago = proximoPago
            };
        }
    }
}
