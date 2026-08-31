using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Commands.CreateDirectLoan
{
    public record CreateDirectLoanRequest
    {
        public string Nombre { get; init; } = string.Empty;
        public string Cedula { get; init; } = string.Empty;
        public string Telefono { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public decimal Monto { get; init; }
        public string Moneda { get; init; } = "DOP";
        public decimal TasaMensual { get; init; }
        public int Plazo { get; init; }
        public FrecuenciaPago FrecuenciaPago { get; init; }
        public decimal GastoCierrePorcentaje { get; init; }
        public TipoPrestamo TipoPrestamo { get; init; }
        public Guid? TenantId { get; init; }
    }

    public record CreateDirectLoanCommand(CreateDirectLoanRequest Request) : IRequest<LoanDto>;

    public class CreateDirectLoanCommandHandler : IRequestHandler<CreateDirectLoanCommand, LoanDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IJournalService _journal;
        private readonly ICapitalGuardService _capitalGuard;

        public CreateDirectLoanCommandHandler(
            IUnitOfWork unitOfWork,
            INotificationService notificationService, IJournalService journal, ICapitalGuardService capitalGuard)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _journal = journal;
            _capitalGuard = capitalGuard;
        }

        public async Task<LoanDto> Handle(CreateDirectLoanCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;
            var moneda = NormalizeCurrency(req.Moneda);
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var existingClients = await _unitOfWork.Clients.ListAsync(cancellationToken);
                var client = existingClients.FirstOrDefault(c => c.Cedula == req.Cedula);
                var tenantId = req.TenantId ?? client?.TenantId ?? Guid.Empty;

                if (client is null)
                {
                    client = new Client
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Nombre = req.Nombre,
                        Cedula = req.Cedula,
                        Email = req.Email,
                        Telefono = req.Telefono,
                        FechaNacimiento = DateTime.UtcNow.AddYears(-30),
                        EstadoCivil = EstadoCivil.Soltero
                    };
                    await _unitOfWork.Clients.AddAsync(client);
                }

                var plazoMeses = req.Plazo;
                var principal = req.Monto + (req.Monto * req.GastoCierrePorcentaje / 100);
                await _capitalGuard.EnsureCanDisburseAsync(tenantId, moneda, req.Monto, cancellationToken);
                var tasaDecimal = req.TasaMensual / 100;

                var totalPeriods = req.FrecuenciaPago switch
                {
                    FrecuenciaPago.Diaria => plazoMeses * 30,
                    FrecuenciaPago.Semanal => plazoMeses * 4,
                    FrecuenciaPago.Quincenal => plazoMeses * 2,
                    _ => plazoMeses
                };

                var ratePerPeriod = req.FrecuenciaPago switch
                {
                    FrecuenciaPago.Diaria => tasaDecimal / 30,
                    FrecuenciaPago.Semanal => tasaDecimal / 4,
                    FrecuenciaPago.Quincenal => tasaDecimal / 2,
                    _ => tasaDecimal
                };

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

                var fechaInicio = DateTime.UtcNow;
                var totalPagar = Math.Round(cuota * totalPeriods, 2);
                var loanApplication = new LoanApplication
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ClientId = client.Id,
                    MontoSolicitado = req.Monto,
                    Moneda = moneda,
                    TasaInteresMensual = req.TasaMensual,
                    Plazo = plazoMeses,
                    UnidadPlazo = UnidadPlazo.Meses,
                    FrecuenciaPago = req.FrecuenciaPago,
                    GastoCierrePorcentaje = req.GastoCierrePorcentaje,
                    CuotaEstimada = cuota,
                    TotalPagar = totalPagar,
                    TotalIntereses = Math.Round(totalPagar - principal, 2),
                    Estado = EstadoSolicitud.Aprobada,
                    TipoPrestamo = req.TipoPrestamo,
                    FechaSolicitud = fechaInicio
                };
                await _unitOfWork.LoanApplications.AddAsync(loanApplication);

                var loan = new Loan
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ClientId = client.Id,
                    LoanApplicationId = loanApplication.Id,
                    MontoOriginal = principal,
                    Moneda = moneda,
                    TasaInteresAnual = req.TasaMensual * 12,
                    PlazoMeses = plazoMeses,
                    CuotaMensual = cuota,
                    SaldoPendiente = principal,
                    Estado = EstadoPrestamo.Activo,
                    Tipo = req.TipoPrestamo,
                    FrecuenciaPago = req.FrecuenciaPago,
                    FechaInicio = fechaInicio,
                    FechaVencimiento = fechaInicio.AddMonths(plazoMeses),
                    CreatedAt = DateTime.UtcNow
                };

                GenerateInstallments(loan, principal, req.TasaMensual, cuota, CalculatePaymentDate(fechaInicio, 1, req.FrecuenciaPago));
                await _unitOfWork.Loans.AddAsync(loan, cancellationToken);
                var disbursementLines = new List<JournalLineInput>
                {
                    new("LOAN_RECEIVABLE", req.Monto, 0, "Desembolso de préstamo", moneda),
                    new("CASH", 0, req.Monto, "Salida por desembolso", moneda)
                };
                var closingFee = loan.MontoOriginal - req.Monto;
                if (closingFee > 0)
                {
                    disbursementLines[0] = new JournalLineInput("LOAN_RECEIVABLE", loan.MontoOriginal, 0, "Desembolso y gasto de cierre capitalizado", moneda);
                    disbursementLines.Add(new JournalLineInput("COMMISSION_INCOME", 0, closingFee, "Gasto de cierre", moneda));
                }
                await _journal.PostAsync(tenantId, "loan.disbursement", loan.Id, disbursementLines, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                var tenant = await _unitOfWork.Tenants.GetByIdAsync(tenantId, cancellationToken);
                var email = LoanEmailBuilder.Created(loan, client, _notificationService.ClientPortalUrl);
                var pdf = AmortizationPdfBuilder.Build(loan, client, tenant?.Nombre);
                await _notificationService.SendEmailAsync(
                    client.Email,
                    email.Subject,
                    email.Html,
                    new[] { new EmailAttachment($"tabla-amortizacion-{loan.Id:N}.pdf", pdf) });

                return new LoanDto
                {
                    Id = loan.Id,
                    ClientId = loan.ClientId,
                    Cliente = client.Nombre,
                    Cedula = client.Cedula,
                    Email = client.Email,
                    Telefono = client.Telefono,
                    Monto = loan.MontoOriginal,
                    Moneda = loan.Moneda,
                    Tasa = loan.TasaInteresAnual,
                    Plazo = loan.PlazoMeses,
                    CuotaMensual = loan.CuotaMensual,
                    SaldoPendiente = loan.SaldoPendiente,
                    Estado = loan.Estado,
                    Tipo = loan.Tipo,
                    FrecuenciaPago = loan.FrecuenciaPago,
                    FechaInicio = loan.FechaInicio,
                    FechaVencimiento = loan.FechaVencimiento
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }

        private static string NormalizeCurrency(string? value) =>
            CurrencyCatalog.Normalize(value);

        private static void GenerateInstallments(Loan loan, decimal principal, decimal tasaMensual, decimal cuotaPeriodo, DateTime firstPaymentDate)
        {
            var periodsPerMonth = loan.FrecuenciaPago switch
            {
                FrecuenciaPago.Diaria => 30,
                FrecuenciaPago.Semanal => 4,
                FrecuenciaPago.Quincenal => 2,
                _ => 1
            };
            var totalPayments = loan.PlazoMeses * periodsPerMonth;
            var monthlyRateDecimal = tasaMensual / 100;
            var ratePerPeriod = monthlyRateDecimal / periodsPerMonth;
            var saldo = principal;

            for (int i = 1; i <= totalPayments; i++)
            {
                var interes = Math.Round(saldo * ratePerPeriod, 2);
                var capital = Math.Round(cuotaPeriodo - interes, 2);
                saldo -= capital;

                var fechaPago = loan.FrecuenciaPago switch
                {
                    FrecuenciaPago.Mensual => firstPaymentDate.AddMonths(i - 1),
                    FrecuenciaPago.Quincenal => firstPaymentDate.AddDays((i - 1) * 15),
                    FrecuenciaPago.Semanal => firstPaymentDate.AddDays((i - 1) * 7),
                    FrecuenciaPago.Diaria => firstPaymentDate.AddDays(i - 1),
                    _ => firstPaymentDate.AddMonths(i - 1)
                };

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

        private static DateTime CalculatePaymentDate(DateTime start, int number, FrecuenciaPago frequency) => frequency switch
        {
            FrecuenciaPago.Mensual => start.AddMonths(number),
            FrecuenciaPago.Quincenal => start.AddDays(number * 15),
            FrecuenciaPago.Semanal => start.AddDays(number * 7),
            FrecuenciaPago.Diaria => start.AddDays(number),
            _ => start.AddMonths(number)
        };
    }
}
