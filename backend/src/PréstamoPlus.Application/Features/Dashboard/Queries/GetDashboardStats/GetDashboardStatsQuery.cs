using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Dashboard.Queries.GetDashboardStats
{
    public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;

    public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetDashboardStatsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            var loans = await _unitOfWork.Loans.ListAsync(cancellationToken);
            var solicitudes = await _unitOfWork.LoanApplications.ListAsync(cancellationToken);

            return new DashboardStatsDto
            {
                TotalPrestado = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.MontoOriginal),
                Disponible = 1000000 - loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.SaldoPendiente),
                EnCartera = loans.Count(l => l.Estado == EstadoPrestamo.Activo),
                PorCobrar = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.SaldoPendiente),
                SolicitudesPendientes = solicitudes.Count(s => s.Estado == EstadoSolicitud.Pendiente)
            };
        }
    }
}
