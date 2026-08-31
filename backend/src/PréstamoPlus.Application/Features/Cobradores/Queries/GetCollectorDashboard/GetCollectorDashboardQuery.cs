using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Cobradores.Queries.GetCollectorDashboard
{
    public record GetCollectorDashboardQuery(Guid CollectorId) : IRequest<CollectorDashboardDto>;

    public class GetCollectorDashboardQueryHandler : IRequestHandler<GetCollectorDashboardQuery, CollectorDashboardDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetCollectorDashboardQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CollectorDashboardDto> Handle(GetCollectorDashboardQuery request, CancellationToken cancellationToken)
        {
            var collector = await _unitOfWork.Collectors.GetByIdAsync(request.CollectorId);
            if (collector is null)
                throw new InvalidOperationException("Cobrador no encontrado.");

            var user = await _unitOfWork.Users.GetByIdAsync(collector.UserId);

            var allAssignments = await _unitOfWork.CollectionAssignments.ListAsync(cancellationToken);
            var assignments = allAssignments.Where(a => a.CollectorId == request.CollectorId).ToList();

            var allVisits = await _unitOfWork.CollectionVisits.ListAsync(cancellationToken);

            var assignmentDtos = new List<CollectionAssignmentDto>();
            int exitosos = 0, parciales = 0, sinResultado = 0;
            decimal montoCobrado = 0;

            foreach (var assignment in assignments)
            {
                var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
                var client = loan is not null ? await _unitOfWork.Clients.GetByIdAsync(loan.ClientId) : null;
                if (loan?.TenantId != collector.TenantId || client?.TenantId != collector.TenantId)
                {
                    continue;
                }
                var visits = allVisits.Where(v => v.AssignmentId == assignment.Id).ToList();
                var lastVisit = visits.OrderByDescending(v => v.CreatedAt).FirstOrDefault();

                if (lastVisit is not null)
                {
                    if (lastVisit.TipoVisita == TipoVisita.CobroExitoso) exitosos++;
                    else if (lastVisit.TipoVisita == TipoVisita.CobroParcial) parciales++;
                    else sinResultado++;
                    montoCobrado += lastVisit.MontoRecibido;
                }
                else
                {
                    sinResultado++;
                }

                assignmentDtos.Add(new CollectionAssignmentDto
                {
                    Id = assignment.Id,
                    CollectorId = assignment.CollectorId,
                    LoanId = assignment.LoanId,
                    ClienteNombre = client?.Nombre ?? "",
                    ClienteCedula = client?.Cedula ?? "",
                    ClienteTelefono = client?.Telefono ?? "",
                    MontoOriginal = loan?.MontoOriginal ?? 0,
                    CuotaMensual = loan?.CuotaMensual ?? 0,
                    SaldoPendiente = loan?.SaldoPendiente ?? 0,
                    Frecuencia = loan?.FrecuenciaPago ?? FrecuenciaPago.Mensual,
                    EstadoPrestamo = loan?.Estado ?? EstadoPrestamo.Activo,
                    Estado = assignment.Estado,
                    IsQRAuthorized = assignment.IsQRAuthorized,
                    QRGenerationAttempts = assignment.QRGenerationAttempts,
                    QRPermissionRequested = assignment.QRPermissionRequested,
                    AssignedAt = assignment.AssignedAt,
                    UltimaVisita = lastVisit?.CreatedAt,
                    UltimoResultado = lastVisit?.TipoVisita
                });
            }

            return new CollectorDashboardDto
            {
                CollectorNombre = user?.Nombre ?? "",
                Zona = collector.Zona,
                TotalAsignados = assignments.Count,
                CobrosExitosos = exitosos,
                CobrosParciales = parciales,
                SinResultado = sinResultado,
                MontoCobrado = montoCobrado,
                MontoPendiente = assignmentDtos.Sum(a => a.SaldoPendiente),
                Asignaciones = assignmentDtos.OrderByDescending(a => a.AssignedAt).ToList()
            };
        }
    }
}
