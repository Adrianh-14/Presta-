using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.CreateSolicitud
{
    public class CreateSolicitudCommandHandler : IRequestHandler<CreateSolicitudCommand, LoanApplicationDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateSolicitudCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanApplicationDto> Handle(CreateSolicitudCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var client = new Client
                {
                    Id = Guid.NewGuid(),
                    TenantId = req.TenantId ?? Guid.Empty,
                    Nombre = req.Client.Nombre,
                    Cedula = req.Client.Cedula,
                    Email = req.Client.Email,
                    Telefono = req.Client.Telefono,
                    FechaNacimiento = req.Client.FechaNacimiento,
                    EstadoCivil = req.Client.EstadoCivil
                };
                await _unitOfWork.Clients.AddAsync(client);

                var workInfo = new WorkInformation
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Empresa = req.WorkInformation.Empresa,
                    Cargo = req.WorkInformation.Cargo,
                    Salario = req.WorkInformation.Salario,
                    AntiguedadAnios = req.WorkInformation.AntiguedadAnios,
                    DireccionEmpresa = req.WorkInformation.DireccionEmpresa,
                    TelefonoEmpresa = req.WorkInformation.TelefonoEmpresa,
                    TipoEmpleo = req.WorkInformation.TipoEmpleo
                };
                await _unitOfWork.WorkInformation.AddAsync(workInfo);

                var address = new Address
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Direccion = req.Address.Direccion,
                    Ciudad = req.Address.Ciudad,
                    Provincia = req.Address.Provincia,
                    Sector = req.Address.Sector,
                    CodigoPostal = req.Address.CodigoPostal
                };
                await _unitOfWork.Addresses.AddAsync(address);

                foreach (var refDto in req.References)
                {
                    var reference = new Reference
                    {
                        Id = Guid.NewGuid(),
                        ClientId = client.Id,
                        Nombre = refDto.Nombre,
                        Relacion = refDto.Relacion,
                        Telefono = refDto.Telefono,
                        Email = refDto.Email
                    };
                    await _unitOfWork.References.AddAsync(reference);
                }

                var bankAccount = new BankAccount
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Banco = req.BankAccount.Banco,
                    TipoCuenta = req.BankAccount.TipoCuenta,
                    NumeroCuenta = req.BankAccount.NumeroCuenta
                };
                await _unitOfWork.BankAccounts.AddAsync(bankAccount);

                var calcResult = CalculateLoan(
                    req.MontoSolicitado,
                    req.GastoCierrePorcentaje,
                    req.TasaInteresMensual,
                    req.Plazo,
                    req.UnidadPlazo,
                    req.FrecuenciaPago);

                var loanApplication = new LoanApplication
                {
                    Id = Guid.NewGuid(),
                    TenantId = req.TenantId ?? Guid.Empty,
                    ClientId = client.Id,
                    MontoSolicitado = req.MontoSolicitado,
                    TasaInteresMensual = req.TasaInteresMensual,
                    Plazo = req.Plazo,
                    UnidadPlazo = req.UnidadPlazo,
                    FrecuenciaPago = req.FrecuenciaPago,
                    GastoCierrePorcentaje = req.GastoCierrePorcentaje,
                    CuotaEstimada = calcResult.Cuota,
                    TotalPagar = calcResult.TotalPagar,
                    TotalIntereses = calcResult.TotalIntereses,
                    Estado = Domain.Enums.EstadoSolicitud.Pendiente,
                    FechaSolicitud = DateTime.UtcNow
                };
                await _unitOfWork.LoanApplications.AddAsync(loanApplication);

                if (req.VerificationMedia != null)
                {
                    var verification = new VerificationMedia
                    {
                        Id = Guid.NewGuid(),
                        LoanApplicationId = loanApplication.Id,
                        VideoPath = req.VerificationMedia.VideoPath,
                        FotoCedulaPath = req.VerificationMedia.FotoCedulaPath
                    };
                    await _unitOfWork.VerificationMedia.AddAsync(verification);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return new LoanApplicationDto
                {
                    Id = loanApplication.Id,
                    MontoSolicitado = loanApplication.MontoSolicitado,
                    TasaInteresMensual = loanApplication.TasaInteresMensual,
                    Plazo = loanApplication.Plazo,
                    UnidadPlazo = loanApplication.UnidadPlazo,
                    FrecuenciaPago = loanApplication.FrecuenciaPago,
                    GastoCierrePorcentaje = loanApplication.GastoCierrePorcentaje,
                    CuotaEstimada = loanApplication.CuotaEstimada,
                    TotalPagar = loanApplication.TotalPagar,
                    TotalIntereses = loanApplication.TotalIntereses,
                    Estado = loanApplication.Estado,
                    FechaSolicitud = loanApplication.FechaSolicitud,
                    Client = new ClientDto
                    {
                        Id = client.Id,
                        Nombre = client.Nombre,
                        Cedula = client.Cedula,
                        Email = client.Email,
                        Telefono = client.Telefono,
                        FechaNacimiento = client.FechaNacimiento,
                        EstadoCivil = client.EstadoCivil
                    }
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }

        private static (decimal Cuota, decimal TotalPagar, decimal TotalIntereses) CalculateLoan(
            decimal monto, decimal gastoCierrePorcentaje, decimal tasaMensual, int plazo,
            Domain.Enums.UnidadPlazo unidadPlazo, Domain.Enums.FrecuenciaPago frecuencia)
        {
            var gastoCierre = monto * (gastoCierrePorcentaje / 100);
            var principal = monto + gastoCierre;
            var tasaDecimal = tasaMensual / 100;

            int totalPeriodos;
            decimal tasaPorPeriodo;

            switch (frecuencia)
            {
                case Domain.Enums.FrecuenciaPago.Diaria:
                    tasaPorPeriodo = tasaDecimal / 30;
                    totalPeriodos = unidadPlazo == Domain.Enums.UnidadPlazo.Anios ? plazo * 360 : plazo * 30;
                    break;
                case Domain.Enums.FrecuenciaPago.Semanal:
                    tasaPorPeriodo = tasaDecimal / 4;
                    totalPeriodos = unidadPlazo == Domain.Enums.UnidadPlazo.Anios ? plazo * 48 : plazo * 4;
                    break;
                case Domain.Enums.FrecuenciaPago.Quincenal:
                    tasaPorPeriodo = tasaDecimal / 2;
                    totalPeriodos = unidadPlazo == Domain.Enums.UnidadPlazo.Anios ? plazo * 24 : plazo * 2;
                    break;
                default:
                    tasaPorPeriodo = tasaDecimal;
                    totalPeriodos = unidadPlazo == Domain.Enums.UnidadPlazo.Anios ? plazo * 12 : plazo;
                    break;
            }

            if (totalPeriodos <= 0 || principal <= 0)
                return (0, 0, 0);

            if (tasaPorPeriodo <= 0)
            {
                var cuota = principal / totalPeriodos;
                return (Math.Round(cuota, 2), principal, 0);
            }

            var factor = Math.Pow(1 + (double)tasaPorPeriodo, totalPeriodos);
            var cuotaCalc = principal * (tasaPorPeriodo * (decimal)factor) / ((decimal)factor - 1);
            var totalPagar = cuotaCalc * totalPeriodos;
            var totalIntereses = totalPagar - principal;

            return (
                Math.Round(cuotaCalc, 2),
                Math.Round(totalPagar, 2),
                Math.Round(totalIntereses, 2)
            );
        }
    }
}
