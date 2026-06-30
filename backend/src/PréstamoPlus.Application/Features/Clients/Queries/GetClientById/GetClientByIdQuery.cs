using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Clients.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Clients.Queries.GetClientById
{
    public record GetClientByIdQuery(Guid Id) : IRequest<ClientDto?>;

    public class GetClientByIdQueryHandler : IRequestHandler<GetClientByIdQuery, ClientDto?>
    {
        private readonly IClientRepository _repository;

        public GetClientByIdQueryHandler(IClientRepository repository)
        {
            _repository = repository;
        }

        public async Task<ClientDto?> Handle(GetClientByIdQuery request, CancellationToken cancellationToken)
        {
            var spec = new ClientByIdWithDetailsSpec(request.Id);
            var client = await _repository.FirstOrDefaultAsync(spec, cancellationToken);
            if (client is null) return null;

            return new ClientDto
            {
                Id = client.Id,
                TenantId = client.TenantId,
                Nombre = client.Nombre,
                Cedula = client.Cedula,
                Email = client.Email,
                Telefono = client.Telefono,
                FechaNacimiento = client.FechaNacimiento,
                EstadoCivil = client.EstadoCivil,
                Estado = client.Estado,
                FechaRegistro = client.FechaRegistro,
                WorkInformation = client.WorkInformation is not null
                    ? new WorkInformationDto
                    {
                        Empresa = client.WorkInformation.Empresa,
                        Cargo = client.WorkInformation.Cargo,
                        Salario = client.WorkInformation.Salario,
                        AntiguedadAnios = client.WorkInformation.AntiguedadAnios,
                        DireccionEmpresa = client.WorkInformation.DireccionEmpresa,
                        TelefonoEmpresa = client.WorkInformation.TelefonoEmpresa,
                        TipoEmpleo = client.WorkInformation.TipoEmpleo
                    }
                    : null,
                Address = client.Address is not null
                    ? new AddressDto
                    {
                        Direccion = client.Address.Direccion,
                        Ciudad = client.Address.Ciudad,
                        Provincia = client.Address.Provincia,
                        Sector = client.Address.Sector,
                        CodigoPostal = client.Address.CodigoPostal
                    }
                    : null,
                BankAccount = client.BankAccount is not null
                    ? new BankAccountDto
                    {
                        Banco = client.BankAccount.Banco,
                        TipoCuenta = client.BankAccount.TipoCuenta,
                        NumeroCuenta = client.BankAccount.NumeroCuenta
                    }
                    : null,
                References = client.References?.Select(r => new ReferenceDto
                {
                    Nombre = r.Nombre,
                    Relacion = r.Relacion,
                    Telefono = r.Telefono,
                    Email = r.Email
                }).ToList() ?? new(),
                VerificationMedia = client.LoanApplications
                    ?.Where(la => la.VerificationMedia != null)
                    .OrderByDescending(la => la.FechaSolicitud)
                    .Select(la => new VerificationMediaDto
                    {
                        VideoPath = la.VerificationMedia!.VideoPath,
                        FotoCedulaPath = la.VerificationMedia!.FotoCedulaPath
                    })
                    .FirstOrDefault()
            };
        }
    }
}
