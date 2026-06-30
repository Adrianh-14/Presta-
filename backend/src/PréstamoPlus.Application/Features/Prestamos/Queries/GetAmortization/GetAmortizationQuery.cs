using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Specifications;
using PréstamoPlus.Application.Features.Prestamos.Specifications;
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

            var installments = await _unitOfWork.Installments.ListAsync(
                new InstallmentsByLoanIdSpec(request.Id),
                cancellationToken);

            if (!installments.Any())
            {
                return GenerateAmortizationTable(loan);
            }

            var table = new List<AmortizationRowDto>();
            decimal saldo = loan.MontoOriginal;

            foreach (var inst in installments)
            {
                var saldoInicial = saldo;
                saldo = Math.Max(0, saldo - inst.Capital);

                string estado = inst.Estado switch
                {
                    Domain.Enums.EstadoInstallment.Pagado => "Pagado",
                    Domain.Enums.EstadoInstallment.Parcial => "Parcial",
                    _ when inst.FechaPago.Date < DateTime.UtcNow.Date => "Vencido",
                    _ => "Pendiente"
                };

                table.Add(new AmortizationRowDto
                {
                    Numero = inst.Numero,
                    FechaPago = inst.FechaPago,
                    Cuota = inst.Cuota,
                    Capital = inst.Capital,
                    Interes = inst.Interes,
                    SaldoInicial = Math.Round(saldoInicial, 2),
                    SaldoFinal = Math.Round(saldo, 2),
                    Estado = estado
                });
            }

            return table;
        }

        private static List<AmortizationRowDto> GenerateAmortizationTable(Domain.Entities.Loan loan)
        {
            var monthlyRate = loan.TasaInteresAnual / 100 / 12;
            var periodsPerMonth = GetPeriodsPerMonth(loan.FrecuenciaPago);
            var totalPayments = loan.PlazoMeses * (int)periodsPerMonth;
            decimal ratePerPeriod = monthlyRate / periodsPerMonth;
            decimal cuotaPorPeriodo = loan.CuotaMensual;

            var table = new List<AmortizationRowDto>();
            decimal saldo = loan.MontoOriginal;

            for (int i = 1; i <= totalPayments; i++)
            {
                var saldoInicial = saldo;
                var interes = Math.Round(saldo * ratePerPeriod, 2);
                var capital = Math.Round(cuotaPorPeriodo - interes, 2);
                saldo -= capital;

                var fechaPago = CalculatePaymentDate(loan.FechaInicio, i, loan.FrecuenciaPago);

                string estado;
                if (loan.Estado == Domain.Enums.EstadoPrestamo.Pagado)
                    estado = "Pagado";
                else if (fechaPago.Date < DateTime.UtcNow.Date)
                    estado = "Vencido";
                else
                    estado = "Pendiente";

                table.Add(new AmortizationRowDto
                {
                    Numero = i,
                    FechaPago = fechaPago,
                    Cuota = Math.Round(cuotaPorPeriodo, 2),
                    Capital = capital,
                    Interes = interes,
                    SaldoInicial = Math.Round(saldoInicial, 2),
                    SaldoFinal = Math.Max(0, Math.Round(saldo, 2)),
                    Estado = estado
                });
            }

            return table;
        }

        private static decimal GetPeriodsPerMonth(Domain.Enums.FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                Domain.Enums.FrecuenciaPago.Diaria => 30,
                Domain.Enums.FrecuenciaPago.Semanal => 4,
                Domain.Enums.FrecuenciaPago.Quincenal => 2,
                Domain.Enums.FrecuenciaPago.Mensual => 1,
                _ => 1
            };
        }

        private static DateTime CalculatePaymentDate(DateTime fechaInicio, int paymentNumber, Domain.Enums.FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                Domain.Enums.FrecuenciaPago.Mensual => fechaInicio.AddMonths(paymentNumber),
                Domain.Enums.FrecuenciaPago.Quincenal => fechaInicio.AddDays(paymentNumber * 15),
                Domain.Enums.FrecuenciaPago.Semanal => fechaInicio.AddDays(paymentNumber * 7),
                Domain.Enums.FrecuenciaPago.Diaria => fechaInicio.AddDays(paymentNumber),
                _ => fechaInicio.AddMonths(paymentNumber)
            };
        }
    }
}
