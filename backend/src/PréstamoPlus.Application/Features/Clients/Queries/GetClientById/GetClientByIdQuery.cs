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
                Nombre = client.Nombre,
                Cedula = client.Cedula,
                Email = client.Email,
                Telefono = client.Telefono,
                FechaNacimiento = client.FechaNacimiento,
                EstadoCivil = client.EstadoCivil,
                Estado = client.Estado,
                FechaRegistro = client.FechaRegistro
            };
        }
    }
}
