using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Dashboard.Queries.GetCollections
{
    public record GetCollectionsQuery() : IRequest<CollectionsDto>;

    public class GetCollectionsQueryHandler : IRequestHandler<GetCollectionsQuery, CollectionsDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetCollectionsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CollectionsDto> Handle(GetCollectionsQuery request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var startOfWeek = today.AddDays(-((int)today.DayOfWeek + 6) % 7);
            var endOfWeek = startOfWeek.AddDays(7);
            var isFirstHalf = today.Day <= 15;
            var startOfQuincena = new DateTime(today.Year, today.Month, isFirstHalf ? 1 : 16, 0, 0, 0, DateTimeKind.Utc);
            var endOfQuincena = isFirstHalf
                ? new DateTime(today.Year, today.Month, 16, 0, 0, 0, DateTimeKind.Utc)
                : new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
            var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var activeLoans = await _unitOfWork.Loans.ListAsync(cancellationToken);

            var loanIds = activeLoans
                .Where(l => l.Estado != EstadoPrestamo.Pagado && l.Estado != EstadoPrestamo.Cancelado)
                .Select(l => l.Id)
                .ToList();

            var periodoDtos = new List<PeriodCollectionDto>();

            foreach (var freq in new[] { FrecuenciaPago.Diaria, FrecuenciaPago.Semanal, FrecuenciaPago.Quincenal, FrecuenciaPago.Mensual })
            {
                var freqLoanIds = activeLoans
                    .Where(l => l.FrecuenciaPago == freq && l.Estado != EstadoPrestamo.Pagado && l.Estado != EstadoPrestamo.Cancelado)
                    .Select(l => l.Id)
                    .ToList();

                if (!freqLoanIds.Any()) continue;

                var freqInstallments = new List<Domain.Entities.Installment>();
                foreach (var lid in freqLoanIds)
                {
                    var insts = await _unitOfWork.Installments.ListAsync(
                        new InstallmentsByLoanIdSpec(lid),
                        cancellationToken);
                    freqInstallments.AddRange(insts);
                }

                var (start, end, etiqueta) = freq switch
                {
                    FrecuenciaPago.Diaria => (today, today.AddDays(1), "Hoy"),
                    FrecuenciaPago.Semanal => (startOfWeek, endOfWeek, $"Semana {startOfWeek:dd/MM}"),
                    FrecuenciaPago.Quincenal => (startOfQuincena, endOfQuincena, isFirstHalf ? "1ra Quincena" : "2da Quincena"),
                    _ => (startOfMonth, endOfMonth, $"{startOfMonth:MMMM}")
                };

                var pendientes = freqInstallments
                    .Where(i => i.Estado != EstadoInstallment.Pagado &&
                                i.FechaPago >= start && i.FechaPago < end)
                    .ToList();

                decimal montoEstimado = pendientes.Sum(i => i.Capital - i.CapitalPagado + i.Interes - i.InteresPagado);
                var periodLoanIds = pendientes.Select(i => i.LoanId).Distinct().ToList();

                periodoDtos.Add(new PeriodCollectionDto
                {
                    Frecuencia = freq.ToString().ToLower(),
                    Etiqueta = etiqueta,
                    MontoEstimado = Math.Round(montoEstimado, 2),
                    CuotasPendientes = pendientes.Count,
                    LoanIds = periodLoanIds
                });
            }

            return new CollectionsDto
            {
                Periodos = periodoDtos,
                TotalCobranzaPeriodo = Math.Round(periodoDtos.Sum(p => p.MontoEstimado), 2)
            };
        }
    }
}
