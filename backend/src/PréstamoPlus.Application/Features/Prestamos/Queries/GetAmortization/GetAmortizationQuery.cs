using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Prestamos.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Queries.GetAmortization
{
    public record GetAmortizationQuery(Guid Id) : IRequest<List<AmortizationRowDto>?>;

    public class GetAmortizationQueryHandler : IRequestHandler<GetAmortizationQuery, List<AmortizationRowDto>?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAmortizationQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<AmortizationRowDto>?> Handle(GetAmortizationQuery request, CancellationToken cancellationToken)
        {
            var spec = new LoanByIdWithClientSpec(request.Id);
            var loan = await _unitOfWork.Loans.FirstOrDefaultAsync(spec, cancellationToken);
            if (loan is null) return null;

            var monthlyRate = loan.TasaInteresAnual / 100 / 12;
            var principal = loan.MontoOriginal;
            var totalPeriods = loan.PlazoMeses;

            var table = new List<AmortizationRowDto>();
            decimal saldo = principal;
            int totalPayments = CalculateTotalPayments(totalPeriods, loan.FrecuenciaPago);
            decimal paymentRate = monthlyRate / GetPeriodsPerMonth(loan.FrecuenciaPago);

            for (int i = 1; i <= totalPayments; i++)
            {
                var saldoInicial = saldo;
                var interes = saldo * paymentRate;
                var factor = Math.Pow(1 + (double)paymentRate, totalPayments);
                var cuotaFija = principal * ((decimal)paymentRate * (decimal)factor) / ((decimal)factor - 1);
                var capital = cuotaFija - interes;
                saldo = saldo - capital;

                var fechaPago = CalculatePaymentDate(loan.FechaInicio, i, loan.FrecuenciaPago);

                table.Add(new AmortizationRowDto
                {
                    Numero = i,
                    FechaPago = fechaPago,
                    Cuota = Math.Round(cuotaFija, 2),
                    Capital = Math.Round(capital, 2),
                    Interes = Math.Round(interes, 2),
                    SaldoInicial = Math.Round(saldoInicial, 2),
                    SaldoFinal = Math.Max(0, Math.Round(saldo, 2)),
                    Estado = DetermineEstado(i, totalPayments, loan.Estado)
                });
            }

            return table;
        }

        private static int CalculateTotalPayments(int plazoMeses, FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                FrecuenciaPago.Diaria => plazoMeses * 30,
                FrecuenciaPago.Semanal => plazoMeses * 4,
                FrecuenciaPago.Quincenal => plazoMeses * 2,
                FrecuenciaPago.Mensual => plazoMeses,
                _ => plazoMeses
            };
        }

        private static decimal GetPeriodsPerMonth(FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                FrecuenciaPago.Diaria => 30,
                FrecuenciaPago.Semanal => 4,
                FrecuenciaPago.Quincenal => 2,
                FrecuenciaPago.Mensual => 1,
                _ => 1
            };
        }

        private static DateTime CalculatePaymentDate(DateTime fechaInicio, int paymentNumber, FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                FrecuenciaPago.Mensual => fechaInicio.AddMonths(paymentNumber),
                FrecuenciaPago.Quincenal => paymentNumber % 2 == 0
                    ? fechaInicio.AddDays(paymentNumber / 2 * 15)
                    : fechaInicio.AddDays(paymentNumber / 2 * 15),
                FrecuenciaPago.Semanal => fechaInicio.AddDays(paymentNumber * 7),
                FrecuenciaPago.Diaria => fechaInicio.AddDays(paymentNumber),
                _ => fechaInicio.AddMonths(paymentNumber)
            };
        }

        private static string DetermineEstado(int paymentNumber, int totalPayments, Domain.Enums.EstadoPrestamo loanEstado)
        {
            if (loanEstado == Domain.Enums.EstadoPrestamo.Pagado) return "Pagado";
            if (paymentNumber < totalPayments / 2) return "Pagado";
            if (paymentNumber == totalPayments / 2 + 1) return "Pendiente";
            return "Futuro";
        }
    }
}
