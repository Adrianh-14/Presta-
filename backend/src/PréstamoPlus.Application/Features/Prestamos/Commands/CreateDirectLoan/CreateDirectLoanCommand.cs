using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
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
        public decimal TasaMensual { get; init; }
        public int Plazo { get; init; }
        public FrecuenciaPago FrecuenciaPago { get; init; }
        public decimal GastoCierrePorcentaje { get; init; }
        public TipoPrestamo TipoPrestamo { get; init; }
        public Guid TenantId { get; init; }
    }

    public record CreateDirectLoanCommand(CreateDirectLoanRequest Request) : IRequest<LoanDto>;

    public class CreateDirectLoanCommandHandler : IRequestHandler<CreateDirectLoanCommand, LoanDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateDirectLoanCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanDto> Handle(CreateDirectLoanCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var existingClients = await _unitOfWork.Clients.ListAsync(cancellationToken);
                var client = existingClients.FirstOrDefault(c => c.Cedula == req.Cedula);

                if (client is null)
                {
                    client = new Client
                    {
                        Id = Guid.NewGuid(),
                        TenantId = req.TenantId,
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
                var loan = new Loan
                {
                    Id = Guid.NewGuid(),
                    TenantId = req.TenantId,
                    ClientId = client.Id,
                    LoanApplicationId = Guid.NewGuid(),
                    MontoOriginal = principal,
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

                GenerateInstallments(loan, principal, req.TasaMensual, cuota);
                await _unitOfWork.Loans.AddAsync(loan, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return new LoanDto
                {
                    Id = loan.Id,
                    ClientId = loan.ClientId,
                    Cliente = client.Nombre,
                    Cedula = client.Cedula,
                    Email = client.Email,
                    Telefono = client.Telefono,
                    Monto = loan.MontoOriginal,
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

        private static void GenerateInstallments(Loan loan, decimal principal, decimal tasaMensual, decimal cuotaPeriodo)
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
                    FrecuenciaPago.Mensual => loan.FechaInicio.AddMonths(i),
                    FrecuenciaPago.Quincenal => loan.FechaInicio.AddDays(i * 15),
                    FrecuenciaPago.Semanal => loan.FechaInicio.AddDays(i * 7),
                    FrecuenciaPago.Diaria => loan.FechaInicio.AddDays(i),
                    _ => loan.FechaInicio.AddMonths(i)
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
    }
}
