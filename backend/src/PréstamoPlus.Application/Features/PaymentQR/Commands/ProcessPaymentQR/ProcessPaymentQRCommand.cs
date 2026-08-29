using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.PaymentQR.Commands.ProcessPaymentQR
{
    public record ProcessPaymentQRCommand(ProcessPaymentQRRequest Request) : IRequest<PaymentQRProcessResult>;

    public class ProcessPaymentQRCommandHandler : IRequestHandler<ProcessPaymentQRCommand, PaymentQRProcessResult>
    {
        private static readonly SemaphoreSlim ProcessingLock = new(1, 1);
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IJournalService _journal;

        public ProcessPaymentQRCommandHandler(IUnitOfWork unitOfWork, INotificationService notificationService, IJournalService journal)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _journal = journal;
        }

        public async Task<PaymentQRProcessResult> Handle(ProcessPaymentQRCommand request, CancellationToken cancellationToken)
        {
            await ProcessingLock.WaitAsync(cancellationToken);
            try
            {
            var req = request.Request;

            var allQRs = await _unitOfWork.PaymentQRs.ListAsync(cancellationToken);
            var paymentQR = allQRs.FirstOrDefault(q => q.Token == req.Token);

            if (paymentQR is null)
                return new PaymentQRProcessResult { Success = false, Message = "QR no encontrado." };

            if (paymentQR.Status == PaymentQRStatus.Used)
                return new PaymentQRProcessResult { Success = false, Message = "Este QR ya fue utilizado." };

            if (paymentQR.Status == PaymentQRStatus.Expired || paymentQR.ExpiresAt <= DateTime.UtcNow)
            {
                paymentQR.Status = PaymentQRStatus.Expired;
                await _unitOfWork.PaymentQRs.UpdateAsync(paymentQR, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return new PaymentQRProcessResult { Success = false, Message = "Este QR ha expirado. Solicita uno nuevo al cobrador." };
            }

            if (paymentQR.Status == PaymentQRStatus.Cancelled)
                return new PaymentQRProcessResult { Success = false, Message = "Este QR fue cancelado." };

            var loan = await _unitOfWork.Loans.GetByIdAsync(paymentQR.LoanId);
            if (loan is null)
                return new PaymentQRProcessResult { Success = false, Message = "Préstamo no encontrado." };

            var client = await _unitOfWork.Clients.GetByIdAsync(paymentQR.ClientId);
            if (client is null)
                return new PaymentQRProcessResult { Success = false, Message = "Cliente no encontrado." };

            if (loan.SaldoPendiente <= 0)
                return new PaymentQRProcessResult { Success = false, Message = "Este préstamo ya está pagado." };

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                paymentQR.Status = PaymentQRStatus.Used;
                paymentQR.UsedAt = DateTime.UtcNow;
                paymentQR.Latitud = req.Latitud;
                paymentQR.Longitud = req.Longitud;
                await _unitOfWork.PaymentQRs.UpdateAsync(paymentQR, cancellationToken);

                var installments = await _unitOfWork.Installments.ListAsync(cancellationToken);
                var loanInstallments = installments.Where(i => i.LoanId == paymentQR.LoanId).ToList();

                decimal remaining = paymentQR.Monto;
                decimal totalCapital = 0;
                decimal totalInteres = 0;

                var unpaidLateFees = (await _unitOfWork.LateFees.ListAsync(cancellationToken))
                    .Where(lf => lf.LoanId == paymentQR.LoanId && !lf.Pagado && lf.Monto > 0)
                    .OrderBy(lf => lf.FechaCalculo)
                    .ToList();

                decimal totalMora = 0;
                foreach (var lateFee in unpaidLateFees)
                {
                    if (remaining <= 0) break;
                    var moraAplicada = Math.Min(remaining, lateFee.Monto);
                    remaining -= moraAplicada;
                    totalMora += moraAplicada;
                    if (moraAplicada >= lateFee.Monto)
                        lateFee.Pagado = true;
                    else
                        lateFee.Monto -= moraAplicada;
                    await _unitOfWork.LateFees.UpdateAsync(lateFee, cancellationToken);
                }

                foreach (var inst in loanInstallments)
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

                decimal nuevoSaldo = loanInstallments.Sum(i => i.Capital - i.CapitalPagado);
                loan.SaldoPendiente = nuevoSaldo;

                var quedanMoras = unpaidLateFees.Any(lf => !lf.Pagado && lf.Monto > 0);
                var quedanCuotasVencidas = loanInstallments.Any(i =>
                    i.Estado != EstadoInstallment.Pagado && i.FechaPago.Date < DateTime.UtcNow.Date);

                if (nuevoSaldo <= 0 && !quedanMoras)
                    loan.Estado = EstadoPrestamo.Pagado;
                else if (quedanMoras || quedanCuotasVencidas)
                    loan.Estado = EstadoPrestamo.Mora;
                else if (loan.Estado == EstadoPrestamo.Pagado || loan.Estado == EstadoPrestamo.Mora)
                    loan.Estado = EstadoPrestamo.Activo;

                var payment = new Domain.Entities.Payment
                {
                    Id = Guid.NewGuid(),
                    LoanId = paymentQR.LoanId,
                    Monto = paymentQR.Monto,
                    Moneda = loan.Moneda,
                    Capital = totalCapital,
                    Interes = totalInteres,
                    MoraPagada = totalMora,
                    SaldoRestante = nuevoSaldo,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = MetodoPago.Efectivo,
                    ReferenciaExterna = $"QR-{paymentQR.Token[..8]}",
                    Notas = $"Pago vía QR por cobrador",
                    IdempotencyKey = paymentQR.Token
                };

                await _unitOfWork.Payments.AddAsync(payment, cancellationToken);
                await _unitOfWork.Loans.UpdateAsync(loan, cancellationToken);
                var journalLines = new List<JournalLineInput> { new("CASH", payment.Monto, 0, "Cobro de pago QR") };
                if (payment.Capital > 0) journalLines.Add(new("LOAN_RECEIVABLE", 0, payment.Capital, "Aplicación QR a capital"));
                if (payment.Interes > 0) journalLines.Add(new("INTEREST_INCOME", 0, payment.Interes, "Aplicación QR a interés"));
                if (payment.MoraPagada > 0) journalLines.Add(new("LATE_FEE_INCOME", 0, payment.MoraPagada, "Aplicación QR a mora"));
                await _journal.PostAsync(loan.TenantId, "payment.qr", payment.Id, journalLines, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                _ = Task.Run(async () =>
                {
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(client.Email))
                        {
                            var email = LoanEmailBuilder.PaymentReceived(loan, client, payment, _notificationService.ClientPortalUrl);
                            await _notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);
                        }
                    }
                    catch { }
                }, cancellationToken);

                return new PaymentQRProcessResult
                {
                    Success = true,
                    PaymentId = payment.Id,
                    Message = "Pago procesado exitosamente.",
                    Monto = payment.Monto,
                    Moneda = payment.Moneda,
                    Fecha = payment.FechaPago,
                    ClienteNombre = client.Nombre,
                    SaldoRestante = nuevoSaldo
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
            }
            finally
            {
                ProcessingLock.Release();
            }
        }
    }
}
