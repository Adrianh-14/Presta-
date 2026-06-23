using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Commands.CreatePayment
{
    public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, PaymentDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreatePaymentCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PaymentDto> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;
            var loan = await _unitOfWork.Loans.GetByIdAsync(req.LoanId);
            if (loan is null)
                throw new InvalidOperationException("Préstamo no encontrado.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                decimal monto = req.Monto;
                decimal capital = 0;
                decimal interes = 0;
                decimal saldoRestante = loan.SaldoPendiente;

                if (loan.SaldoPendiente <= 0)
                    throw new InvalidOperationException("Este préstamo ya está pagado.");

                decimal tasaMensual = loan.TasaInteresAnual / 100 / 12;
                decimal interesPeriodo = Math.Round(loan.SaldoPendiente * tasaMensual, 2);

                if (monto <= interesPeriodo)
                {
                    interes = monto;
                    capital = 0;
                }
                else
                {
                    interes = interesPeriodo;
                    capital = monto - interes;
                    if (capital > saldoRestante)
                        capital = saldoRestante;
                }

                saldoRestante = loan.SaldoPendiente - capital;

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
                    Monto = monto,
                    Capital = capital,
                    Interes = interes,
                    MoraPagada = 0,
                    SaldoRestante = saldoRestante,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = metodo,
                    ReferenciaExterna = req.ReferenciaExterna,
                    Notas = req.Notas
                };

                await _unitOfWork.Payments.AddAsync(payment);

                loan.SaldoPendiente = saldoRestante;
                if (saldoRestante <= 0)
                    loan.Estado = EstadoPrestamo.Pagado;

                await _unitOfWork.Loans.UpdateAsync(loan, cancellationToken);
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
