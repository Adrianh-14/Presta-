using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Commands.CreateMoraPayment
{
    public class CreateMoraPaymentCommandHandler : IRequestHandler<CreateMoraPaymentCommand, PaymentDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLog;

        public CreateMoraPaymentCommandHandler(IUnitOfWork unitOfWork, INotificationService notificationService, IAuditLogService auditLog)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _auditLog = auditLog;
        }

        public async Task<PaymentDto> Handle(CreateMoraPaymentCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;
            var loan = await _unitOfWork.Loans.GetByIdAsync(req.LoanId);
            if (loan is null)
                throw new InvalidOperationException("Préstamo no encontrado.");
            if (!string.IsNullOrWhiteSpace(req.Moneda) && !string.Equals(req.Moneda, loan.Moneda, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"La moneda del pago debe ser {loan.Moneda}.");
            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey) &&
                (await _unitOfWork.Payments.ListAsync(cancellationToken)).Any(p => p.LoanId == req.LoanId && p.IdempotencyKey == req.IdempotencyKey))
                throw new InvalidOperationException("Este pago ya fue procesado.");

            var lateFee = await _unitOfWork.LateFees.GetByIdAsync(req.LateFeeId);
            if (lateFee is null || lateFee.LoanId != req.LoanId)
                throw new InvalidOperationException("Mora no encontrada para este préstamo.");

            if (lateFee.Pagado)
                throw new InvalidOperationException("Esta mora ya fue pagada.");

            if (req.Monto <= 0 || req.Monto != decimal.Round(req.Monto, 2) || req.Monto > lateFee.Monto)
                throw new InvalidOperationException("El monto de la mora no es válido.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                decimal montoMora = req.Monto;

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
                    Moneda = loan.Moneda,
                    Capital = 0,
                    Interes = 0,
                    MoraPagada = montoMora,
                    SaldoRestante = loan.SaldoPendiente,
                    FechaPago = DateTime.UtcNow,
                    MetodoPago = metodo,
                    ReferenciaExterna = req.ReferenciaExterna,
                    Notas = req.Notas
                    ,IdempotencyKey = req.IdempotencyKey
                };

                await _unitOfWork.Payments.AddAsync(payment);

                lateFee.Monto -= montoMora;
                lateFee.Pagado = lateFee.Monto <= 0;
                await _unitOfWork.LateFees.UpdateAsync(lateFee, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                await _auditLog.AppendAsync(loan.TenantId, null, "late_fee.payment.created", "LateFee", lateFee.Id,
                    new { payment.Id, payment.Monto }, cancellationToken);

                var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);
                if (client is not null && !string.IsNullOrWhiteSpace(client.Email))
                {
                    var email = LoanEmailBuilder.PaymentReceived(
                        loan,
                        client,
                        payment,
                        _notificationService.ClientPortalUrl);
                    await _notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);
                }

                return new PaymentDto
                {
                    Id = payment.Id,
                    LoanId = payment.LoanId,
                    Monto = payment.Monto,
                    Moneda = payment.Moneda,
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
