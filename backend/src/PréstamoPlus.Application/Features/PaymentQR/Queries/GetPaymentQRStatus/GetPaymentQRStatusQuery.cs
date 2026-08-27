using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.PaymentQR.Queries.GetPaymentQRStatus
{
    public record GetPaymentQRStatusQuery(string Token) : IRequest<QRPaymentInfoDto?>;

    public class GetPaymentQRStatusQueryHandler : IRequestHandler<GetPaymentQRStatusQuery, QRPaymentInfoDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPaymentQRStatusQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<QRPaymentInfoDto?> Handle(GetPaymentQRStatusQuery request, CancellationToken cancellationToken)
        {
            var allQRs = await _unitOfWork.PaymentQRs.ListAsync(cancellationToken);
            var paymentQR = allQRs.FirstOrDefault(q => q.Token == request.Token);

            if (paymentQR is null) return null;

            var loan = await _unitOfWork.Loans.GetByIdAsync(paymentQR.LoanId);
            var client = await _unitOfWork.Clients.GetByIdAsync(paymentQR.ClientId);
            var collector = await _unitOfWork.Collectors.GetByIdAsync(paymentQR.CollectorId);
            var collectorUser = collector is not null ? await _unitOfWork.Users.GetByIdAsync(collector.UserId) : null;

            var status = paymentQR.Status;
            if (status == PaymentQRStatus.Pending && paymentQR.ExpiresAt <= DateTime.UtcNow)
                status = PaymentQRStatus.Expired;

            var estadoMensaje = status switch
            {
                PaymentQRStatus.Pending => "QR activo. Confirma tu pago.",
                PaymentQRStatus.Used => "Este pago ya fue procesado.",
                PaymentQRStatus.Expired => "Este QR ha expirado.",
                PaymentQRStatus.Cancelled => "Este QR fue cancelado.",
                _ => ""
            };

            return new QRPaymentInfoDto
            {
                AssignmentId = paymentQR.AssignmentId,
                ClienteNombre = MaskName(client?.Nombre),
                ClienteCedula = MaskValue(client?.Cedula),
                ClienteTelefono = MaskValue(client?.Telefono),
                CollectorNombre = collectorUser?.Nombre ?? "",
                Monto = paymentQR.Monto,
                SaldoPendiente = loan?.SaldoPendiente ?? 0,
                ExpiresAt = paymentQR.ExpiresAt,
                Status = status,
                EstadoMensaje = estadoMensaje
            };
        }

        private static string MaskName(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length == 1 ? parts[0] : $"{parts[0]} {parts[1][0]}.";
        }

        private static string MaskValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var compact = new string(value.Where(char.IsLetterOrDigit).ToArray());
            return compact.Length <= 4 ? compact : $"***{compact[^4..]}";
        }
    }
}
