using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Solicituds.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Solicituds.Queries.GetSolicitudById
{
    public class GetSolicitudByIdQueryHandler : IRequestHandler<GetSolicitudByIdQuery, LoanApplicationDto?>
    {
        private readonly ILoanApplicationRepository _repository;

        public GetSolicitudByIdQueryHandler(ILoanApplicationRepository repository)
        {
            _repository = repository;
        }

        public async Task<LoanApplicationDto?> Handle(GetSolicitudByIdQuery request, CancellationToken cancellationToken)
        {
            var spec = new LoanApplicationByIdWithClientSpec(request.Id);
            var loan = await _repository.FirstOrDefaultAsync(spec, cancellationToken);
            if (loan is null) return null;

            return new LoanApplicationDto
            {
                Id = loan.Id,
                MontoSolicitado = loan.MontoSolicitado,
                TasaInteresMensual = loan.TasaInteresMensual,
                Plazo = loan.Plazo,
                UnidadPlazo = loan.UnidadPlazo,
                FrecuenciaPago = loan.FrecuenciaPago,
                GastoCierrePorcentaje = loan.GastoCierrePorcentaje,
                CuotaEstimada = loan.CuotaEstimada,
                TotalPagar = loan.TotalPagar,
                TotalIntereses = loan.TotalIntereses,
                Estado = loan.Estado,
                TipoPrestamo = loan.TipoPrestamo,
                FechaSolicitud = loan.FechaSolicitud,
                Client = new ClientDto
                {
                    Id = loan.Client.Id,
                    Nombre = loan.Client.Nombre,
                    Cedula = loan.Client.Cedula,
                    Email = loan.Client.Email,
                    Telefono = loan.Client.Telefono,
                    FechaNacimiento = loan.Client.FechaNacimiento,
                    EstadoCivil = loan.Client.EstadoCivil
                },
                WorkInformation = loan.Client.WorkInformation is not null
                    ? new WorkInformationDto
                    {
                        Empresa = loan.Client.WorkInformation.Empresa,
                        Cargo = loan.Client.WorkInformation.Cargo,
                        Salario = loan.Client.WorkInformation.Salario,
                        AntiguedadAnios = loan.Client.WorkInformation.AntiguedadAnios,
                        DireccionEmpresa = loan.Client.WorkInformation.DireccionEmpresa,
                        TelefonoEmpresa = loan.Client.WorkInformation.TelefonoEmpresa,
                        TipoEmpleo = loan.Client.WorkInformation.TipoEmpleo
                    }
                    : null,
                Address = loan.Client.Address is not null
                    ? new AddressDto
                    {
                        Direccion = loan.Client.Address.Direccion,
                        Ciudad = loan.Client.Address.Ciudad,
                        Provincia = loan.Client.Address.Provincia,
                        Sector = loan.Client.Address.Sector,
                        CodigoPostal = loan.Client.Address.CodigoPostal
                    }
                    : null,
                References = loan.Client.References?.Select(r => new ReferenceDto
                {
                    Nombre = r.Nombre,
                    Relacion = r.Relacion,
                    Telefono = r.Telefono,
                    Email = r.Email
                }).ToList() ?? new(),
                BankAccount = loan.Client.BankAccount is not null
                    ? new BankAccountDto
                    {
                        Banco = loan.Client.BankAccount.Banco,
                        TipoCuenta = loan.Client.BankAccount.TipoCuenta,
                        NumeroCuenta = loan.Client.BankAccount.NumeroCuenta
                    }
                    : null,
                VerificationMedia = loan.VerificationMedia is not null
                    ? new VerificationMediaDto
                    {
                        VideoPath = loan.VerificationMedia.VideoPath,
                        FotoCedulaPath = loan.VerificationMedia.FotoCedulaPath
                    }
                    : null
            };
        }
    }
}
