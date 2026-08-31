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

            if (!assignment.IsQRAuthorized)
                throw new InvalidOperationException("Este préstamo no está autorizado para cobro por QR.");

            if (assignment.QRGenerationAttempts >= 3)
            {
                assignment.QRPermissionRequested = true;
                await _unitOfWork.CollectionAssignments.UpdateAsync(assignment, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                throw new InvalidOperationException("Se alcanzó el límite de 3 QR para este cliente. Solicita al administrador una nueva autorización.");
            }

            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            if (loan is null || loan.TenantId != collector.TenantId)
                throw new InvalidOperationException("Préstamo no encontrado.");

            var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);
            if (client is null || client.TenantId != collector.TenantId)
                throw new InvalidOperationException("Cliente no encontrado.");

            var installments = (await _unitOfWork.Installments.ListAsync(cancellationToken))
                .Where(item => item.LoanId == loan.Id && item.Estado != EstadoInstallment.Pagado)
                .ToList();
            var lateFees = (await _unitOfWork.LateFees.ListAsync(cancellationToken))
                .Where(item => item.LoanId == loan.Id && !item.Pagado && item.Monto > 0)
                .ToList();
            var outstanding = installments.Sum(item =>
                    Math.Max(0, item.Capital - item.CapitalPagado) +
                    Math.Max(0, item.Interes - item.InteresPagado)) +
                lateFees.Sum(item => item.Monto);
            if (req.Monto <= 0 || req.Monto != decimal.Round(req.Monto, 2) || req.Monto > outstanding)
                throw new InvalidOperationException("El monto del QR no es válido para el saldo pendiente.");

            var allQRs = await _unitOfWork.PaymentQRs.ListAsync(cancellationToken);
            var activeQR = allQRs.FirstOrDefault(q =>
                q.AssignmentId == req.AssignmentId &&
                q.Status == PaymentQRStatus.Pending &&
                q.ExpiresAt > DateTime.UtcNow);

            if (activeQR is not null)
                throw new InvalidOperationException("Ya existe un QR activo para este préstamo. Espera a que expire.");

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
                Monto = req.Monto,
                Moneda = loan.Moneda,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                Status = PaymentQRStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PaymentQRs.AddAsync(paymentQR, cancellationToken);
            assignment.QRGenerationAttempts++;
            assignment.QRPermissionRequested = assignment.QRGenerationAttempts >= 3;
            await _unitOfWork.CollectionAssignments.UpdateAsync(assignment, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PaymentQRDto
            {
                Id = paymentQR.Id,
                Token = token,
                ClienteNombre = client.Nombre,
                ClienteCedula = client.Cedula,
                Monto = req.Monto,
                Moneda = paymentQR.Moneda,
                ExpiresAt = paymentQR.ExpiresAt,
                Status = PaymentQRStatus.Pending,
                CreatedAt = paymentQR.CreatedAt
            };
        }
    }
}
