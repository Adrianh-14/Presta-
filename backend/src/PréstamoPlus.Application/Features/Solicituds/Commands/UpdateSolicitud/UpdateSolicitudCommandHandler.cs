using MediatR;
using PréstamoPlus.Application.Common;
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
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLog;

        public UpdateSolicitudCommandHandler(
            IUnitOfWork unitOfWork,
            INotificationService notificationService,
            IAuditLogService auditLog)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _auditLog = auditLog;
        }

        public async Task<LoanApplicationDto?> Handle(UpdateSolicitudCommand request, CancellationToken cancellationToken)
        {
            var spec = new LoanApplicationByIdWithClientSpec(request.Id, asNoTracking: false);
            var loanApp = await _unitOfWork.LoanApplications.FirstOrDefaultAsync(spec, cancellationToken);
            if (loanApp is null) return null;

            var validTransition = loanApp.Estado switch
            {
                EstadoSolicitud.Pendiente => request.Estado == EstadoSolicitud.Procesando,
                EstadoSolicitud.Procesando => request.Estado is EstadoSolicitud.Aprobada or EstadoSolicitud.Rechazada,
                _ => false
            };

            if (!validTransition)
                throw new InvalidOperationException(
                    $"No se puede cambiar una solicitud de {loanApp.Estado} a {request.Estado}.");

            if (request.Estado == EstadoSolicitud.Aprobada)
            {
                if (!request.ActorUserId.HasValue)
                    throw new UnauthorizedAccessException("La aprobación requiere un usuario autenticado.");
                if (loanApp.FirstApprovedBy is null)
                {
                    loanApp.FirstApprovedBy = request.ActorUserId;
                    loanApp.FirstApprovedAt = DateTime.UtcNow;
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    return null;
                }
                loanApp.SecondApprovedBy = request.ActorUserId;
                loanApp.SecondApprovedAt = DateTime.UtcNow;
            }

            loanApp.Estado = request.Estado;
            Loan? createdLoan = null;

            if (request.Estado == EstadoSolicitud.Aprobada)
            {
                var montoAprobado = request.MontoAprobado ?? loanApp.MontoSolicitado;
                var tasaMensual = request.TasaInteresMensual ?? loanApp.TasaInteresMensual;
                var gastoCierre = request.GastoCierrePorcentaje ?? loanApp.GastoCierrePorcentaje;
                var plazo = request.Plazo ?? loanApp.Plazo;
                var unidadPlazo = request.UnidadPlazo ?? loanApp.UnidadPlazo;
                var frecuencia = request.FrecuenciaPago ?? loanApp.FrecuenciaPago;

                if (montoAprobado <= 0)
                    throw new ArgumentException("El monto aprobado debe ser mayor que cero.");
                if (tasaMensual < 0 || gastoCierre < 0)
                    throw new ArgumentException("Las tasas no pueden ser negativas.");
                if (plazo <= 0)
                    throw new ArgumentException("El plazo debe ser mayor que cero.");
                if (!Enum.IsDefined(frecuencia))
                    throw new ArgumentException("La frecuencia de pago no es válida.");

                var rawFecha = request.FechaInicio ?? DateTime.UtcNow;
                var fechaInicio = rawFecha.Kind == DateTimeKind.Utc ? rawFecha : DateTime.SpecifyKind(rawFecha, DateTimeKind.Utc);
                var plazoMeses = unidadPlazo == UnidadPlazo.Anios ? plazo * 12 : plazo;
                var principal = montoAprobado + (montoAprobado * gastoCierre / 100);
                var (cuota, totalPagar, totalIntereses) = CalculateLoan(
                    principal,
                    tasaMensual,
                    plazoMeses,
                    frecuencia);

                loanApp.MontoSolicitado = montoAprobado;
                loanApp.TasaInteresMensual = tasaMensual;
                loanApp.GastoCierrePorcentaje = gastoCierre;
                loanApp.Plazo = plazo;
                loanApp.UnidadPlazo = unidadPlazo;
                loanApp.FrecuenciaPago = frecuencia;
                loanApp.CuotaEstimada = cuota;
                loanApp.TotalPagar = totalPagar;
                loanApp.TotalIntereses = totalIntereses;

                var loan = new Loan
                {
                    Id = Guid.NewGuid(),
                    TenantId = loanApp.TenantId,
                    ClientId = loanApp.ClientId,
                    LoanApplicationId = loanApp.Id,
                    MontoOriginal = principal,
                    TasaInteresAnual = tasaMensual * 12,
                    PlazoMeses = plazoMeses,
                    CuotaMensual = cuota,
                    SaldoPendiente = principal,
                    Estado = EstadoPrestamo.Activo,
                    Tipo = loanApp.TipoPrestamo,
                    FrecuenciaPago = frecuencia,
                    FechaInicio = fechaInicio,
                    FechaVencimiento = fechaInicio.AddMonths(plazoMeses),
                    CreatedAt = DateTime.UtcNow
                };

                var defaultFirstPayment = CalculatePaymentDate(fechaInicio, 1, frecuencia);
                var rawFirstPayment = request.FechaPrimerPago ?? defaultFirstPayment;
                var firstPayment = rawFirstPayment.Kind == DateTimeKind.Utc
                    ? rawFirstPayment
                    : DateTime.SpecifyKind(rawFirstPayment, DateTimeKind.Utc);
                if (firstPayment.Date < fechaInicio.Date)
                    throw new ArgumentException("La primera fecha de pago no puede ser anterior a la fecha de inicio.");

                GenerateInstallments(loan, principal, tasaMensual, cuota, firstPayment);
                loan.FechaVencimiento = loan.Installments.Max(i => i.FechaPago);
                await _unitOfWork.Loans.AddAsync(loan, cancellationToken);
                createdLoan = loan;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _auditLog.AppendAsync(loanApp.TenantId, null, $"loan_application.{request.Estado.ToString().ToLowerInvariant()}",
                "LoanApplication", loanApp.Id,
                new { request.Estado, request.MontoAprobado, CreatedLoanId = createdLoan?.Id }, cancellationToken);

            if (createdLoan is not null)
            {
                var loanEmail = LoanEmailBuilder.Created(
                    createdLoan,
                    loanApp.Client,
                    _notificationService.ClientPortalUrl);
                var pdf = AmortizationPdfBuilder.Build(createdLoan, loanApp.Client);
                await _notificationService.SendEmailAsync(
                    loanApp.Client.Email,
                    loanEmail.Subject,
                    loanEmail.Html,
                    new[] { new EmailAttachment($"tabla-amortizacion-{createdLoan.Id:N}.pdf", pdf) });
            }
            else
            {
                var statusEmail = SolicitudEmailBuilder.Build(
                    loanApp,
                    loanApp.Client,
                    request.Estado,
                    request.Instrucciones,
                    _notificationService.ClientPortalUrl);
                await _notificationService.SendEmailAsync(
                    loanApp.Client.Email,
                    statusEmail.Subject,
                    statusEmail.Html);
            }

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

        private static void GenerateInstallments(
            Loan loan,
            decimal principal,
            decimal tasaMensual,
            decimal cuotaPeriodo,
            DateTime firstPaymentDate)
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

                var fechaPago = CalculatePaymentDate(firstPaymentDate, i - 1, loan.FrecuenciaPago);

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

        private static (decimal Cuota, decimal TotalPagar, decimal TotalIntereses) CalculateLoan(
            decimal principal,
            decimal tasaMensual,
            int plazoMeses,
            FrecuenciaPago frecuencia)
        {
            var periodsPerMonth = GetPeriodsPerMonth(frecuencia);
            var totalPeriods = plazoMeses * periodsPerMonth;
            var ratePerPeriod = tasaMensual / 100 / periodsPerMonth;
            decimal cuota;

            if (ratePerPeriod <= 0)
            {
                cuota = principal / totalPeriods;
            }
            else
            {
                var factor = Math.Pow(1 + (double)ratePerPeriod, totalPeriods);
                cuota = principal * (ratePerPeriod * (decimal)factor) / ((decimal)factor - 1);
            }

            cuota = Math.Round(cuota, 2);
            var total = Math.Round(cuota * totalPeriods, 2);
            return (cuota, total, Math.Round(total - principal, 2));
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
