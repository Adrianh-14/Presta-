using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Application.Features.Solicituds.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.UpdateSolicitud
{
    public class UpdateSolicitudCommandHandler : IRequestHandler<UpdateSolicitudCommand, LoanApplicationDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateSolicitudCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanApplicationDto?> Handle(UpdateSolicitudCommand request, CancellationToken cancellationToken)
        {
            var spec = new LoanApplicationByIdWithClientSpec(request.Id, asNoTracking: false);
            var loanApp = await _unitOfWork.LoanApplications.FirstOrDefaultAsync(spec, cancellationToken);
            if (loanApp is null) return null;

            loanApp.Estado = request.Estado;

            if (request.Estado == EstadoSolicitud.Aprobada)
            {
                var rawFecha = request.FechaInicio ?? DateTime.UtcNow;
                var fechaInicio = rawFecha.Kind == DateTimeKind.Utc ? rawFecha : DateTime.SpecifyKind(rawFecha, DateTimeKind.Utc);
                var plazoMeses = loanApp.UnidadPlazo == UnidadPlazo.Anios
                    ? loanApp.Plazo * 12
                    : loanApp.Plazo;

                var principal = loanApp.MontoSolicitado + (loanApp.MontoSolicitado * loanApp.GastoCierrePorcentaje / 100);

                var loan = new Loan
                {
                    Id = Guid.NewGuid(),
                    TenantId = loanApp.TenantId,
                    ClientId = loanApp.ClientId,
                    LoanApplicationId = loanApp.Id,
                    MontoOriginal = principal,
                    TasaInteresAnual = loanApp.TasaInteresMensual * 12,
                    PlazoMeses = plazoMeses,
                    CuotaMensual = loanApp.CuotaEstimada,
                    SaldoPendiente = principal,
                    Estado = EstadoPrestamo.Activo,
                    Tipo = loanApp.TipoPrestamo,
                    FrecuenciaPago = loanApp.FrecuenciaPago,
                    FechaInicio = fechaInicio,
                    FechaVencimiento = fechaInicio.AddMonths(plazoMeses),
                    CreatedAt = DateTime.UtcNow
                };

                GenerateInstallments(loan, principal, loanApp.TasaInteresMensual, loanApp.CuotaEstimada);
                await _unitOfWork.Loans.AddAsync(loan, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new LoanApplicationDto
            {
                Id = loanApp.Id,
                MontoSolicitado = loanApp.MontoSolicitado,
                TasaInteresMensual = loanApp.TasaInteresMensual,
                Plazo = loanApp.Plazo,
                UnidadPlazo = loanApp.UnidadPlazo,
                FrecuenciaPago = loanApp.FrecuenciaPago,
                GastoCierrePorcentaje = loanApp.GastoCierrePorcentaje,
                CuotaEstimada = loanApp.CuotaEstimada,
                TotalPagar = loanApp.TotalPagar,
                TotalIntereses = loanApp.TotalIntereses,
                Estado = loanApp.Estado,
                TipoPrestamo = loanApp.TipoPrestamo,
                FechaSolicitud = loanApp.FechaSolicitud,
                Client = new ClientDto
                {
                    Id = loanApp.Client.Id,
                    Nombre = loanApp.Client.Nombre,
                    Cedula = loanApp.Client.Cedula,
                    Email = loanApp.Client.Email,
                    Telefono = loanApp.Client.Telefono,
                    FechaNacimiento = loanApp.Client.FechaNacimiento,
                    EstadoCivil = loanApp.Client.EstadoCivil
                },
                WorkInformation = loanApp.Client.WorkInformation is not null
                    ? new WorkInformationDto
                    {
                        Empresa = loanApp.Client.WorkInformation.Empresa,
                        Cargo = loanApp.Client.WorkInformation.Cargo,
                        Salario = loanApp.Client.WorkInformation.Salario,
                        AntiguedadAnios = loanApp.Client.WorkInformation.AntiguedadAnios,
                        DireccionEmpresa = loanApp.Client.WorkInformation.DireccionEmpresa,
                        TelefonoEmpresa = loanApp.Client.WorkInformation.TelefonoEmpresa,
                        TipoEmpleo = loanApp.Client.WorkInformation.TipoEmpleo
                    }
                    : null,
                Address = loanApp.Client.Address is not null
                    ? new AddressDto
                    {
                        Direccion = loanApp.Client.Address.Direccion,
                        Ciudad = loanApp.Client.Address.Ciudad,
                        Provincia = loanApp.Client.Address.Provincia,
                        Sector = loanApp.Client.Address.Sector,
                        CodigoPostal = loanApp.Client.Address.CodigoPostal
                    }
                    : null,
                References = loanApp.Client.References?.Select(r => new ReferenceDto
                {
                    Nombre = r.Nombre,
                    Relacion = r.Relacion,
                    Telefono = r.Telefono,
                    Email = r.Email
                }).ToList() ?? new(),
                BankAccount = loanApp.Client.BankAccount is not null
                    ? new BankAccountDto
                    {
                        Banco = loanApp.Client.BankAccount.Banco,
                        TipoCuenta = loanApp.Client.BankAccount.TipoCuenta,
                        NumeroCuenta = loanApp.Client.BankAccount.NumeroCuenta
                    }
                    : null
            };
        }

        private static void GenerateInstallments(Loan loan, decimal principal, decimal tasaMensual, decimal cuotaPeriodo)
        {
            var periodsPerMonth = GetPeriodsPerMonth(loan.FrecuenciaPago);
            var totalPayments = loan.PlazoMeses * periodsPerMonth;
            var monthlyRateDecimal = tasaMensual / 100;
            var ratePerPeriod = monthlyRateDecimal / periodsPerMonth;
            var saldo = principal;

            for (int i = 1; i <= (int)totalPayments; i++)
            {
                var interes = Math.Round(saldo * ratePerPeriod, 2);
                var capital = Math.Round(cuotaPeriodo - interes, 2);
                saldo -= capital;

                var fechaPago = CalculatePaymentDate(loan.FechaInicio, i, loan.FrecuenciaPago);

                loan.Installments.Add(new Installment
                {
                    Id = Guid.NewGuid(),
                    LoanId = loan.Id,
                    Numero = i,
                    FechaPago = fechaPago,
                    Capital = capital,
                    Interes = interes,
                    Cuota = Math.Round(cuotaPeriodo, 2),
                    CapitalPagado = 0,
                    InteresPagado = 0,
                    MoraPagada = 0,
                    Estado = EstadoInstallment.Pendiente
                });
            }
        }

        private static int GetPeriodsPerMonth(FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                FrecuenciaPago.Diaria => 30,
                FrecuenciaPago.Semanal => 4,
                FrecuenciaPago.Quincenal => 2,
                _ => 1
            };
        }

        private static DateTime CalculatePaymentDate(DateTime fechaInicio, int paymentNumber, FrecuenciaPago frecuencia)
        {
            return frecuencia switch
            {
                FrecuenciaPago.Mensual => fechaInicio.AddMonths(paymentNumber),
                FrecuenciaPago.Quincenal => fechaInicio.AddDays(paymentNumber * 15),
                FrecuenciaPago.Semanal => fechaInicio.AddDays(paymentNumber * 7),
                FrecuenciaPago.Diaria => fechaInicio.AddDays(paymentNumber),
                _ => fechaInicio.AddMonths(paymentNumber)
            };
        }
    }
}
