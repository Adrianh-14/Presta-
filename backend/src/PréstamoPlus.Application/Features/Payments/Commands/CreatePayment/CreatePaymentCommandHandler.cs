using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
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
                var installments = await _unitOfWork.Installments.ListAsync(
                    new InstallmentsByLoanIdSpec(req.LoanId),
                    cancellationToken);

                if (!installments.Any())
                {
                    return await ProcessSaldoPayment(req, loan, cancellationToken);
                }

                decimal remaining = req.Monto;
                decimal totalCapital = 0;
                decimal totalInteres = 0;

                foreach (var inst in installments)
                {
                    if (remaining <= 0) break;
                    if (inst.Estado == EstadoInstallment.Pagado) continue;

                    decimal unpaidInteres = inst.Interes - inst.InteresPagado;
                    decimal unpaidCapital = inst.Capital - inst.CapitalPagado;

                    if (unpaidInteres <= 0 && unpaidCapital <= 0)
                    {
                        inst.Estado = EstadoInstallment.Pagado;
                        continue;
                    }

                    decimal interesAplicado = Math.Min(remaining, unpaidInteres);
                    inst.InteresPagado += interesAplicado;
                    remaining -= interesAplicado;
                    totalInteres += interesAplicado;

                    if (remaining > 0 && unpaidCapital > 0)
                    {
                        decimal capitalAplicado = Math.Min(remaining, unpaidCapital);
                        inst.CapitalPagado += capitalAplicado;
                        remaining -= capitalAplicado;
                        totalCapital += capitalAplicado;
                    }

                    if (inst.CapitalPagado >= inst.Capital && inst.InteresPagado >= inst.Interes)
                        inst.Estado = EstadoInstallment.Pagado;
                    else if (inst.CapitalPagado > 0 || inst.InteresPagado > 0)
                        inst.Estado = EstadoInstallment.Parcial;

                    await _unitOfWork.Installments.UpdateAsync(inst, cancellationToken);
                }

                decimal nuevoSaldo = installments.Sum(i => i.Capital - i.CapitalPagado);
                loan.SaldoPendiente = nuevoSaldo;

                if (nuevoSaldo <= 0)
                    loan.Estado = EstadoPrestamo.Pagado;
                else if (loan.Estado == EstadoPrestamo.Pagado)
                    loan.Estado = EstadoPrestamo.Activo;

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
                    Monto = req.Monto,
                    Capital = totalCapital,
                    Interes = totalInteres,
                    MoraPagada = 0,
                    SaldoRestante = nuevoSaldo,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = metodo,
                    ReferenciaExterna = req.ReferenciaExterna,
                    Notas = req.Notas
                };

                await _unitOfWork.Payments.AddAsync(payment);
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

        private async Task<PaymentDto> ProcessSaldoPayment(CreatePaymentRequest req, Loan loan, CancellationToken cancellationToken)
        {
            decimal monto = req.Monto;
            decimal capital = 0;
            decimal interes = 0;
            decimal saldoRestante = loan.SaldoPendiente;

            if (loan.SaldoPendiente <= 0)
                throw new InvalidOperationException("Este préstamo ya está pagado.");

            decimal periodsPerMonth = loan.FrecuenciaPago switch
            {
                Domain.Enums.FrecuenciaPago.Diaria => 30,
                Domain.Enums.FrecuenciaPago.Semanal => 4,
                Domain.Enums.FrecuenciaPago.Quincenal => 2,
                _ => 1
            };
            decimal tasaMensual = loan.TasaInteresAnual / 100 / 12;
            decimal tasaPeriodo = tasaMensual / periodsPerMonth;
            decimal interesPeriodo = Math.Round(loan.SaldoPendiente * tasaPeriodo, 2);

            decimal maxPago = interesPeriodo + saldoRestante;
            if (monto > maxPago)
                monto = maxPago;

            if (monto <= interesPeriodo)
            {
                interes = monto;
                capital = 0;
            }
            else
            {
                interes = interesPeriodo;
                capital = monto - interes;
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
    }
}
