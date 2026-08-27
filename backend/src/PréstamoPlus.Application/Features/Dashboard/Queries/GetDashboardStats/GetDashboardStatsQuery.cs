using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Application.Features.Dashboard.Queries.GetDashboardStats
{
    public record GetDashboardStatsQuery(Guid? TenantId = null) : IRequest<DashboardStatsDto>;

    public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICapitalGuardService _capitalGuard;

        public GetDashboardStatsQueryHandler(IUnitOfWork unitOfWork, ICapitalGuardService capitalGuard)
        {
            _unitOfWork = unitOfWork;
            _capitalGuard = capitalGuard;
        }

        public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            var loans = await _unitOfWork.Loans.ListAsync(cancellationToken);
            var solicitudes = await _unitOfWork.LoanApplications.ListAsync(cancellationToken);
            if (request.TenantId.HasValue && request.TenantId.Value != Guid.Empty)
            {
                loans = loans.Where(l => l.TenantId == request.TenantId.Value).ToList();
                solicitudes = solicitudes.Where(s => s.TenantId == request.TenantId.Value).ToList();
            }

            var fallbackDisponible = 1000000 - loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.SaldoPendiente);
            var ledgerDisponible = await _capitalGuard.GetAvailableAsync(request.TenantId ?? Guid.Empty, cancellationToken);
            var capitalDisponible = ledgerDisponible == 0 ? fallbackDisponible : ledgerDisponible;
            return new DashboardStatsDto
            {
                TotalPrestado = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.MontoOriginal),
                Disponible = capitalDisponible,
                CapitalDisponible = capitalDisponible,
                EnCartera = loans.Count(l => l.Estado == EstadoPrestamo.Activo),
                PorCobrar = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.SaldoPendiente),
                SolicitudesPendientes = solicitudes.Count(s => s.Estado == EstadoSolicitud.Pendiente)
            };
        }
    }
}
