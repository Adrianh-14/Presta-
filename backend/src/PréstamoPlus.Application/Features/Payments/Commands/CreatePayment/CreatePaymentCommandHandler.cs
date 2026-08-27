using MediatR;
using PréstamoPlus.Application.Common;
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
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLog;
        private readonly IJournalService _journal;

        public CreatePaymentCommandHandler(IUnitOfWork unitOfWork, INotificationService notificationService, IAuditLogService auditLog, IJournalService journal)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _auditLog = auditLog;
            _journal = journal;
        }

        public async Task<PaymentDto> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;
            var loan = await _unitOfWork.Loans.GetByIdAsync(req.LoanId);
            if (loan is null)
                throw new InvalidOperationException("Préstamo no encontrado.");
            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey) &&
                (await _unitOfWork.Payments.ListAsync(cancellationToken)).Any(p => p.LoanId == req.LoanId && p.IdempotencyKey == req.IdempotencyKey))
                throw new InvalidOperationException("Este pago ya fue procesado.");

            if (req.Monto <= 0 || req.Monto != decimal.Round(req.Monto, 2))
                throw new InvalidOperationException("El monto del pago debe ser positivo y tener máximo dos decimales.");

            var validationInstallments = (await _unitOfWork.Installments.ListAsync(
                    new InstallmentsByLoanIdSpec(req.LoanId), cancellationToken))
                .Where(i => i.Estado != EstadoInstallment.Pagado);
            var validationLateFees = await _unitOfWork.LateFees.ListAsync(
                new UnpaidLateFeesByLoanIdSpec(req.LoanId), cancellationToken);
            var validationOutstanding = validationInstallments.Sum(i => Math.Max(0, i.Capital - i.CapitalPagado) + Math.Max(0, i.Interes - i.InteresPagado))
                + validationLateFees.Sum(i => Math.Max(0, i.Monto));
            if (req.Monto > validationOutstanding)
                throw new InvalidOperationException("El monto excede el saldo pendiente.");

            if (req.Monto <= 0 || req.Monto != decimal.Round(req.Monto, 2))
                throw new InvalidOperationException("El monto del pago debe ser positivo y tener máximo dos decimales.");

            var pendingInstallments = (await _unitOfWork.Installments.ListAsync(
                    new InstallmentsByLoanIdSpec(req.LoanId), cancellationToken))
                .Where(i => i.Estado != EstadoInstallment.Pagado);
            var pendingLateFees = await _unitOfWork.LateFees.ListAsync(
                new UnpaidLateFeesByLoanIdSpec(req.LoanId), cancellationToken);
            var outstanding = pendingInstallments.Sum(i => Math.Max(0, i.Capital - i.CapitalPagado) + Math.Max(0, i.Interes - i.InteresPagado))
                + pendingLateFees.Sum(i => Math.Max(0, i.Monto));
            if (req.Monto > outstanding)
                throw new InvalidOperationException("El monto excede el saldo pendiente.");

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
                decimal totalMora = 0;

                var unpaidLateFees = await _unitOfWork.LateFees.ListAsync(
                    new UnpaidLateFeesByLoanIdSpec(req.LoanId),
                    cancellationToken);

                foreach (var lateFee in unpaidLateFees.OrderBy(lf => lf.FechaCalculo))
                {
                    if (remaining <= 0) break;

                    var moraAplicada = Math.Min(remaining, lateFee.Monto);
                    remaining -= moraAplicada;
                    totalMora += moraAplicada;

                    if (moraAplicada >= lateFee.Monto)
                    {
                        lateFee.Pagado = true;
                    }
                    else
                    {
                        lateFee.Monto -= moraAplicada;
                    }

                    await _unitOfWork.LateFees.UpdateAsync(lateFee, cancellationToken);
                }

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

                var quedanMoras = unpaidLateFees.Any(lf => !lf.Pagado && lf.Monto > 0);
                var quedanCuotasVencidas = installments.Any(i =>
                    i.Estado != EstadoInstallment.Pagado && i.FechaPago.Date < DateTime.UtcNow.Date);

                if (nuevoSaldo <= 0 && !quedanMoras)
                    loan.Estado = EstadoPrestamo.Pagado;
                else if (quedanMoras || quedanCuotasVencidas)
                    loan.Estado = EstadoPrestamo.Mora;
                else if (loan.Estado == EstadoPrestamo.Pagado || loan.Estado == EstadoPrestamo.Mora)
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
                    MoraPagada = totalMora,
                    SaldoRestante = nuevoSaldo,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = metodo,
                    ReferenciaExterna = req.ReferenciaExterna,
                    Notas = req.Notas
                    ,IdempotencyKey = req.IdempotencyKey
                };

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.Loans.UpdateAsync(loan, cancellationToken);
                await _journal.PostAsync(loan.TenantId, "payment", payment.Id, BuildPaymentLines(payment), cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                await _auditLog.AppendAsync(loan.TenantId, null, "payment.created", "Loan", loan.Id,
                    new { payment.Id, payment.Monto, payment.MetodoPago }, cancellationToken);

                await NotifyPaymentAsync(loan, payment);

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
                ,IdempotencyKey = req.IdempotencyKey
            };

            await _unitOfWork.Payments.AddAsync(payment);

            loan.SaldoPendiente = saldoRestante;
            if (saldoRestante <= 0)
                loan.Estado = EstadoPrestamo.Pagado;

            await _unitOfWork.Loans.UpdateAsync(loan, cancellationToken);
            await _journal.PostAsync(loan.TenantId, "payment", payment.Id, BuildPaymentLines(payment), cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            await _auditLog.AppendAsync(loan.TenantId, null, "payment.created", "Loan", loan.Id,
                new { payment.Id, payment.Monto, payment.MetodoPago }, cancellationToken);

            await NotifyPaymentAsync(loan, payment);

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

        private async Task NotifyPaymentAsync(Loan loan, Payment payment)
        {
            var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);
            if (client is null || string.IsNullOrWhiteSpace(client.Email)) return;

            var email = LoanEmailBuilder.PaymentReceived(
                loan,
                client,
                payment,
                _notificationService.ClientPortalUrl);
            await _notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);
        }

        private static IReadOnlyCollection<JournalLineInput> BuildPaymentLines(Payment payment)
        {
            var lines = new List<JournalLineInput> { new("CASH", payment.Monto, 0, "Cobro de pago") };
            if (payment.Capital > 0) lines.Add(new JournalLineInput("LOAN_RECEIVABLE", 0, payment.Capital, "Aplicación a capital"));
            if (payment.Interes > 0) lines.Add(new JournalLineInput("INTEREST_INCOME", 0, payment.Interes, "Aplicación a interés"));
            if (payment.MoraPagada > 0) lines.Add(new JournalLineInput("LATE_FEE_INCOME", 0, payment.MoraPagada, "Aplicación a mora"));
            return lines;
        }
    }
}
