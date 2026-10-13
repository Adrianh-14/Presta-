using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Cobradores.Queries.GetAllCollectors
{
    public record GetAllCollectorsQuery(Guid TenantId) : IRequest<List<CollectorDto>>;

    public class GetAllCollectorsQueryHandler : IRequestHandler<GetAllCollectorsQuery, List<CollectorDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllCollectorsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<CollectorDto>> Handle(GetAllCollectorsQuery request, CancellationToken cancellationToken)
        {
            var collectors = (await _unitOfWork.Collectors.ListAsync(cancellationToken))
                .Where(c => c.TenantId == request.TenantId)
                .ToList();

            var allAssignments = await _unitOfWork.CollectionAssignments.ListAsync(cancellationToken);
            var allVisits = await _unitOfWork.CollectionVisits.ListAsync(cancellationToken);
            var allPaymentQRs = await _unitOfWork.PaymentQRs.ListAsync(cancellationToken);
            var allPayments = await _unitOfWork.Payments.ListAsync(cancellationToken);

            var result = new List<CollectorDto>();

            foreach (var collector in collectors)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(collector.UserId);
                var assignments = allAssignments.Where(a => a.CollectorId == collector.Id).ToList();
                var visitIds = assignments.Select(a => a.Id).ToHashSet();
                var visits = allVisits
                    .Where(v => visitIds.Contains(v.AssignmentId) && v.CollectorId == collector.Id)
                    .ToList();
                var qrTokens = allPaymentQRs
                    .Where(qr => qr.CollectorId == collector.Id)
                    .Select(qr => qr.Token)
                    .ToHashSet(StringComparer.Ordinal);
                var qrPayments = allPayments
                    .Where(payment => payment.IdempotencyKey is not null && qrTokens.Contains(payment.IdempotencyKey))
                    .ToList();

                result.Add(new CollectorDto
                {
                    Id = collector.Id,
                    UserId = collector.UserId,
                    Nombre = user?.Nombre ?? "",
                    Email = user?.Email ?? "",
                    Cedula = collector.Cedula,
                    Telefono = collector.Telefono,
                    Zona = collector.Zona,
                    IsActive = collector.IsActive,
                    PhotoUrl = collector.PhotoUrl,
                    TotalAsignados = assignments.Count,
                    CobrosExitosos = visits.Count(v => v.TipoVisita == TipoVisita.CobroExitoso) + qrPayments.Count,
                    MontoCobrado = visits
                        .Where(v => v.TipoVisita is TipoVisita.CobroExitoso or TipoVisita.CobroParcial)
                        .Sum(v => v.MontoRecibido) + qrPayments.Sum(payment => payment.Monto),
                    TotalVisitas = visits.Count,
                    CreatedAt = collector.CreatedAt
                });
            }

            return result.OrderByDescending(c => c.CreatedAt).ToList();
        }
    }
}
