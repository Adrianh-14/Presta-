using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Expenses.Queries.GetFinancialSummary
{
    public record GetFinancialSummaryQuery(Guid TenantId) : IRequest<FinancialSummaryDto>;

    public class GetFinancialSummaryQueryHandler : IRequestHandler<GetFinancialSummaryQuery, FinancialSummaryDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetFinancialSummaryQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<FinancialSummaryDto> Handle(GetFinancialSummaryQuery request, CancellationToken cancellationToken)
        {
            var payments = await _unitOfWork.Payments.ListAsync(cancellationToken);
            var expenses = await _unitOfWork.Expenses.ListAsync(cancellationToken);
            var tenantLoanIds = (await _unitOfWork.Loans.ListAsync(cancellationToken))
                .Where(loan => loan.TenantId == request.TenantId)
                .Select(loan => loan.Id)
                .ToHashSet();
            var tenantPayments = payments
                .Where(payment => tenantLoanIds.Contains(payment.LoanId))
                .ToList();

            decimal totalIngresos = tenantPayments.Sum(p => p.Interes + p.MoraPagada);
            decimal totalGastos = expenses.Where(e => e.TenantId == request.TenantId).Sum(e => e.Amount);
            decimal utilidadNeta = totalIngresos - totalGastos;
            decimal margen = totalIngresos > 0 ? Math.Round((utilidadNeta / totalIngresos) * 100, 1) : 0;

            var tenantExpenses = expenses.Where(e => e.TenantId == request.TenantId).ToList();

            var gastosPorCategoria = tenantExpenses
                .GroupBy(e => e.Category)
                .Select(g => new ExpenseByCategoryDto
                {
                    Category = g.Key,
                    Total = g.Sum(e => e.Amount),
                    Porcentaje = totalGastos > 0 ? Math.Round((g.Sum(e => e.Amount) / totalGastos) * 100, 1) : 0
                })
                .OrderByDescending(x => x.Total)
                .ToList();

            var now = DateTime.UtcNow;
            var tendencia = new List<MonthlyTrendDto>();

            for (int i = 5; i >= 0; i--)
            {
                var month = now.AddMonths(-i);
                var startOfMonth = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var endOfMonth = startOfMonth.AddMonths(1);

                var monthPayments = tenantPayments.Where(p => p.FechaPago >= startOfMonth && p.FechaPago < endOfMonth);
                var monthExpenses = tenantExpenses.Where(e => e.Date >= startOfMonth && e.Date < endOfMonth);

                decimal ing = monthPayments.Sum(p => p.Interes + p.MoraPagada);
                decimal gas = monthExpenses.Sum(e => e.Amount);

                tendencia.Add(new MonthlyTrendDto
                {
                    Mes = startOfMonth.ToString("MMM yyyy"),
                    Ingresos = ing,
                    Gastos = gas,
                    Utilidad = ing - gas
                });
            }

            return new FinancialSummaryDto
            {
                TotalIngresos = totalIngresos,
                TotalGastos = totalGastos,
                UtilidadNeta = utilidadNeta,
                MargenPorcentaje = margen,
                GastosPorCategoria = gastosPorCategoria,
                TendenciaMensual = tendencia
            };
        }
    }
}
