using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Application.Common;
using System.Text.Json;

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

            var ledgerDisponible = await _capitalGuard.GetAvailableAsync(request.TenantId ?? Guid.Empty, "DOP", cancellationToken);
            var tenant = request.TenantId.HasValue ? await _unitOfWork.Tenants.GetByIdAsync(request.TenantId.Value, cancellationToken) : null;
            var capitalPorMoneda = tenant is null ? new Dictionary<string, decimal>() : JsonSerializer.Deserialize<Dictionary<string, decimal>>(tenant.CapitalInicialPorMonedaJson) ?? new();
            foreach (var currency in capitalPorMoneda.Keys.ToList())
                capitalPorMoneda[currency] = await _capitalGuard.GetAvailableAsync(request.TenantId ?? Guid.Empty, currency, cancellationToken);
            capitalPorMoneda["DOP"] = ledgerDisponible;
            return new DashboardStatsDto
            {
                TotalPrestado = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.MontoOriginal),
                Disponible = ledgerDisponible,
                CapitalDisponible = ledgerDisponible,
                CapitalDisponiblePorMoneda = capitalPorMoneda,
                MonedasHabilitadas = (tenant?.MonedasHabilitadas ?? "DOP").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
                EnCartera = loans.Count(l => l.Estado == EstadoPrestamo.Activo),
                PorCobrar = loans.Where(l => l.Estado != EstadoPrestamo.Pagado).Sum(l => l.SaldoPendiente),
                SolicitudesPendientes = solicitudes.Count(s => s.Estado == EstadoSolicitud.Pendiente)
            };
        }
    }
}
