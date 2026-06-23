using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Clients.Commands.UpdateClient
{
    public record UpdateClientCommand(Guid Id, ClientDto Data) : IRequest<ClientDto?>;

    public class UpdateClientCommandHandler : IRequestHandler<UpdateClientCommand, ClientDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateClientCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ClientDto?> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
        {
            var client = await _unitOfWork.Clients.GetByIdAsync(request.Id);
            if (client is null) return null;

            client.Nombre = request.Data.Nombre;
            client.Cedula = request.Data.Cedula;
            client.Email = request.Data.Email;
            client.Telefono = request.Data.Telefono;
            client.FechaNacimiento = request.Data.FechaNacimiento;
            client.EstadoCivil = request.Data.EstadoCivil;
            client.Estado = request.Data.Estado;

            await _unitOfWork.Clients.UpdateAsync(client, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
