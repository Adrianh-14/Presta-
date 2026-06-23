using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Clients.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Clients.Queries.GetAllClients
{
    public record GetAllClientsQuery(string? Search = null, string? Estado = null) : IRequest<IReadOnlyList<ClientDto>>;

    public class GetAllClientsQueryHandler : IRequestHandler<GetAllClientsQuery, IReadOnlyList<ClientDto>>
    {
        private readonly IClientRepository _repository;

        public GetAllClientsQueryHandler(IClientRepository repository)
        {
            _repository = repository;
        }

        public async Task<IReadOnlyList<ClientDto>> Handle(GetAllClientsQuery request, CancellationToken cancellationToken)
        {
            EstadoCliente? estado = request.Estado?.ToLower() switch
            {
                "activo" => EstadoCliente.Activo,
                "inactivo" => EstadoCliente.Inactivo,
                _ => null
            };

            var spec = new AllClientsSpec(request.Search, estado);
            var clients = await _repository.ListAsync(spec, cancellationToken);

            return clients.Select(c => new ClientDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Cedula = c.Cedula,
                Email = c.Email,
                Telefono = c.Telefono,
                FechaNacimiento = c.FechaNacimiento,
                EstadoCivil = c.EstadoCivil,
                Estado = c.Estado,
                FechaRegistro = c.FechaRegistro
            }).ToList();
        }
    }
}
