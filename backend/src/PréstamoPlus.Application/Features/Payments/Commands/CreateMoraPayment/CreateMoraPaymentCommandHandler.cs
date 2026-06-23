using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Commands.CreateMoraPayment
{
    public class CreateMoraPaymentCommandHandler : IRequestHandler<CreateMoraPaymentCommand, PaymentDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateMoraPaymentCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PaymentDto> Handle(CreateMoraPaymentCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;
            var loan = await _unitOfWork.Loans.GetByIdAsync(req.LoanId);
            if (loan is null)
                throw new InvalidOperationException("Préstamo no encontrado.");

            var lateFee = await _unitOfWork.LateFees.GetByIdAsync(req.LateFeeId);
            if (lateFee is null || lateFee.LoanId != req.LoanId)
                throw new InvalidOperationException("Mora no encontrada para este préstamo.");

            if (lateFee.Pagado)
                throw new InvalidOperationException("Esta mora ya fue pagada.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                decimal montoMora = req.Monto > lateFee.Monto ? lateFee.Monto : req.Monto;

                MetodoPago metodo = req.MetodoPago?.ToLower() switch
                {
                    "efectivo" => MetodoPago.Efectivo,
                    "tarjeta" => MetodoPago.Tarjeta,
                    _ => MetodoPago.Transferencia
                };

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    LoanId = req.LoanId,
                    Monto = montoMora,
                    Capital = 0,
                    Interes = 0,
                    MoraPagada = montoMora,
                    SaldoRestante = loan.SaldoPendiente,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = metodo,
                    ReferenciaExterna = req.ReferenciaExterna,
                    Notas = req.Notas
                };

                await _unitOfWork.Payments.AddAsync(payment);

                lateFee.Pagado = true;
                await _unitOfWork.LateFees.UpdateAsync(lateFee, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return new PaymentDto
                {
                    Id = payment.Id,
                    LoanId = payment.LoanId,
                    Monto = payment.Monto,
                    Capital = payment.Capital,
                    Interes = payment.Interes,
                    MoraPagada = payment.MoraPagada,
                    SaldoRestante = payment.SaldoRestante,
                    FechaPago = payment.FechaPago,
                    MetodoPago = payment.MetodoPago,
                    ReferenciaExterna = payment.ReferenciaExterna,
                    Notas = payment.Notas
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
    }
}
