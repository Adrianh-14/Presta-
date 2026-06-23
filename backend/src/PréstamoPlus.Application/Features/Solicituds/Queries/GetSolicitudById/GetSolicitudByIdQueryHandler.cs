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
