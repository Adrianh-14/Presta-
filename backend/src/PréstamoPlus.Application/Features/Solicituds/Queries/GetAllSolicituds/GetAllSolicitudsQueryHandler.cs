using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Solicituds.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Solicituds.Queries.GetAllSolicituds
{
    public class GetAllSolicitudsQueryHandler : IRequestHandler<GetAllSolicitudsQuery, IReadOnlyList<LoanApplicationDto>>
    {
        private readonly ILoanApplicationRepository _repository;

        public GetAllSolicitudsQueryHandler(ILoanApplicationRepository repository)
        {
            _repository = repository;
        }

        public async Task<IReadOnlyList<LoanApplicationDto>> Handle(GetAllSolicitudsQuery request, CancellationToken cancellationToken)
        {
            var spec = new AllLoanApplicationsWithClientSpec(request.TenantId);
            var loans = await _repository.ListAsync(spec, cancellationToken);

            return loans.Select(loan => new LoanApplicationDto
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
                }
            }).ToList();
        }
    }
}
