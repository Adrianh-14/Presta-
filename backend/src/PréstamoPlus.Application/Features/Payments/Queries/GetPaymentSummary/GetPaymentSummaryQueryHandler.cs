using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary
{
    public class GetPaymentSummaryQueryHandler : IRequestHandler<GetPaymentSummaryQuery, PaymentSummaryDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPaymentSummaryQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PaymentSummaryDto?> Handle(GetPaymentSummaryQuery request, CancellationToken cancellationToken)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(request.LoanId);
            if (loan is null) return null;

            var spec = new PaymentsByLoanIdSpec(request.LoanId);
            var payments = await _unitOfWork.Payments.ListAsync(spec, cancellationToken);

            var unpaidMoraSpec = new UnpaidLateFeesByLoanIdSpec(request.LoanId);
            var unpaidLateFees = await _unitOfWork.LateFees.ListAsync(unpaidMoraSpec, cancellationToken);
            var installments = await _unitOfWork.Installments.ListAsync(
                new InstallmentsByLoanIdSpec(request.LoanId), cancellationToken);
            var loanApplication = await _unitOfWork.LoanApplications.GetByIdAsync(loan.LoanApplicationId);

            decimal totalPagado = payments.Sum(p => p.Monto);
            decimal totalCapital = payments.Sum(p => p.Capital);
            decimal totalIntereses = payments.Sum(p => p.Interes);
            decimal totalMora = payments.Sum(p => p.MoraPagada);
            decimal moraPendiente = unpaidLateFees.Sum(lf => lf.Monto);
            var pendingInstallments = installments
                .Where(i => i.Estado != EstadoInstallment.Pagado)
                .ToList();
            var capitalPendiente = pendingInstallments.Count > 0
                ? pendingInstallments.Sum(i => Math.Max(0, i.Capital - i.CapitalPagado))
                : Math.Max(0, loan.SaldoPendiente);
            var interesesPendientes = pendingInstallments.Count > 0
                ? pendingInstallments.Sum(i => Math.Max(0, i.Interes - i.InteresPagado))
                : CalculateCurrentPeriodInterest(loan);
            var cuotasPendientes = capitalPendiente + interesesPendientes;
            // El gasto de cierre ya forma parte del principal financiado y, por
            // tanto, del capital pendiente. No se vuelve a sumar para evitar
            // cobrarlo dos veces.
            var gastoCierre = Math.Max(0, loan.MontoOriginal - (loanApplication?.MontoSolicitado ?? loan.MontoOriginal));
            var gastosLegales = 0m; // Aún no existe un cargo legal registrado en el modelo.
            var totalLiquidacion = cuotasPendientes + moraPendiente + gastosLegales;
            int diasMora = unpaidLateFees.Count == 0 ? 0 : unpaidLateFees.Max(lf => lf.DiasAtraso);

            DateTime? proximoPago = null;
            if (loan.Estado != EstadoPrestamo.Pagado)
            {
                var paymentsCount = payments.Count;
                proximoPago = loan.FrecuenciaPago switch
                {
                    FrecuenciaPago.Diaria => loan.FechaInicio.AddDays(paymentsCount + 1),
                    FrecuenciaPago.Semanal => loan.FechaInicio.AddDays((paymentsCount + 1) * 7),
                    FrecuenciaPago.Quincenal => loan.FechaInicio.AddDays((paymentsCount + 1) * 15),
                    _ => loan.FechaInicio.AddMonths(paymentsCount + 1)
                };
            }

            return new PaymentSummaryDto
            {
                TotalPagado = totalPagado,
                TotalCapital = totalCapital,
                TotalIntereses = totalIntereses,
                TotalMora = totalMora,
                MoraPendiente = moraPendiente,
                CuotaBase = loan.CuotaMensual,
                CuotaConMora = loan.CuotaMensual + moraPendiente,
                DiasMora = diasMora,
                SaldoPendiente = loan.SaldoPendiente,
                CapitalPendiente = capitalPendiente,
                InteresesPendientes = interesesPendientes,
                GastoCierre = gastoCierre,
                GastosLegales = gastosLegales,
                TotalLiquidacion = totalLiquidacion,
                TotalAPagar = totalLiquidacion,
                TotalPagos = payments.Count,
                ProximoPago = proximoPago,
                CuotasParciales = installments
                    .Where(item => item.Estado == EstadoInstallment.Parcial)
                    .OrderBy(item => item.Numero)
                    .Select(item => new PartialInstallmentSummaryDto
                    {
                        NumeroCuota = item.Numero,
                        FechaPago = item.FechaPago,
                        MontoCuota = item.Cuota,
                        MontoPagado = Math.Max(0, item.CapitalPagado) + Math.Max(0, item.InteresPagado),
                        MontoPendiente = Math.Max(0, item.Capital - item.CapitalPagado) + Math.Max(0, item.Interes - item.InteresPagado)
                    }).ToList()
            };
        }

        private static decimal CalculateCurrentPeriodInterest(PréstamoPlus.Domain.Entities.Loan loan)
        {
            var periodsPerMonth = loan.FrecuenciaPago switch
            {
                FrecuenciaPago.Diaria => 30m,
                FrecuenciaPago.Semanal => 4m,
                FrecuenciaPago.Quincenal => 2m,
                _ => 1m
            };
            var monthlyRate = loan.TasaInteresAnual / 100m / 12m;
            return Math.Round(Math.Max(0, loan.SaldoPendiente) * monthlyRate / periodsPerMonth, 2);
        }
    }
}
