using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Queries.GetPaymentsByLoanId
{
    public class GetPaymentsByLoanIdQueryHandler : IRequestHandler<GetPaymentsByLoanIdQuery, IReadOnlyList<PaymentDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPaymentsByLoanIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<PaymentDto>> Handle(GetPaymentsByLoanIdQuery request, CancellationToken cancellationToken)
        {
            var spec = new PaymentsByLoanIdSpec(request.LoanId);
            var payments = await _unitOfWork.Payments.ListAsync(spec, cancellationToken);

            return payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                LoanId = p.LoanId,
                Monto = p.Monto,
                Moneda = p.Moneda,
                Capital = p.Capital,
                Interes = p.Interes,
                MoraPagada = p.MoraPagada,
                SaldoRestante = p.SaldoRestante,
                FechaPago = p.FechaPago,
                MetodoPago = p.MetodoPago,
                ReferenciaExterna = p.ReferenciaExterna,
                Notas = p.Notas
            }).ToList();
        }
    }
}
