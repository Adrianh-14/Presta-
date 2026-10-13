using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.PaymentQR.Commands.GeneratePaymentQR
{
    public record GeneratePaymentQRCommand(GeneratePaymentQRRequest Request, Guid CollectorId) : IRequest<PaymentQRDto>;

    public class GeneratePaymentQRCommandHandler : IRequestHandler<GeneratePaymentQRCommand, PaymentQRDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GeneratePaymentQRCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PaymentQRDto> Handle(GeneratePaymentQRCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;

            var collector = await _unitOfWork.Collectors.GetByIdAsync(request.CollectorId);
            if (collector is null)
                throw new InvalidOperationException("Cobrador no encontrado.");

            var assignment = await _unitOfWork.CollectionAssignments.GetByIdAsync(req.AssignmentId);
            if (assignment is null || assignment.CollectorId != request.CollectorId)
                throw new InvalidOperationException("Asignación no encontrada.");
            if (req.InstallmentNumber <= 0 || !assignment.IsQRAuthorized ||
                !assignment.AuthorizedQRInstallments.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Any(value => int.TryParse(value, out var number) && number == req.InstallmentNumber))
                throw new InvalidOperationException("Esta cuota no está autorizada por el administrador para cobro por QR.");

            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            if (loan is null || loan.TenantId != collector.TenantId)
                throw new InvalidOperationException("Préstamo no encontrado.");

            var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);
            if (client is null || client.TenantId != collector.TenantId)
                throw new InvalidOperationException("Cliente no encontrado.");

            var installment = (await _unitOfWork.Installments.ListAsync(cancellationToken))
                .FirstOrDefault(item => item.LoanId == loan.Id && item.Numero == req.InstallmentNumber && item.Estado != EstadoInstallment.Pagado);
            if (installment is null)
                throw new InvalidOperationException("La cuota autorizada ya no está pendiente.");
            var outstanding = Math.Max(0, installment.Capital - installment.CapitalPagado) +
                Math.Max(0, installment.Interes - installment.InteresPagado);
            if (req.Monto <= 0 || req.Monto != decimal.Round(req.Monto, 2) || req.Monto > outstanding)
                throw new InvalidOperationException("El monto excede el saldo de la cuota autorizada.");

            var allQRs = await _unitOfWork.PaymentQRs.ListAsync(cancellationToken);
            var activeQR = allQRs.FirstOrDefault(q =>
                q.AssignmentId == req.AssignmentId &&
                q.InstallmentNumber == req.InstallmentNumber &&
                q.Status == PaymentQRStatus.Pending &&
                q.ExpiresAt > DateTime.UtcNow);

            if (activeQR is not null)
                throw new InvalidOperationException("Ya existe un QR activo para esta cuota. Espera a que expire.");

            var attemptsForInstallment = allQRs.Count(q => q.AssignmentId == req.AssignmentId && q.InstallmentNumber == req.InstallmentNumber);
            if (attemptsForInstallment >= 3)
                throw new InvalidOperationException("Se alcanzó el límite de 3 QR para esta cuota. Contacta al administrador.");

            var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                .ToLowerInvariant();

            var paymentQR = new Domain.Entities.PaymentQR
            {
                Id = Guid.NewGuid(),
                Token = token,
                AssignmentId = req.AssignmentId,
                CollectorId = request.CollectorId,
                LoanId = assignment.LoanId,
                ClientId = loan.ClientId,
                InstallmentNumber = req.InstallmentNumber,
                Monto = req.Monto,
                Moneda = loan.Moneda,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                Status = PaymentQRStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PaymentQRs.AddAsync(paymentQR, cancellationToken);
            assignment.QRGenerationAttempts++;
            assignment.QRPermissionRequested = false;
            await _unitOfWork.CollectionAssignments.UpdateAsync(assignment, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PaymentQRDto
            {
                Id = paymentQR.Id,
                Token = token,
                ClienteNombre = client.Nombre,
                ClienteCedula = client.Cedula,
                Monto = req.Monto,
                NumeroCuota = req.InstallmentNumber,
                Moneda = paymentQR.Moneda,
                ExpiresAt = paymentQR.ExpiresAt,
                Status = PaymentQRStatus.Pending,
                CreatedAt = paymentQR.CreatedAt
            };
        }
    }
}
