using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Auth.Commands.ClientAccess
{
    public record ClientAccessCommand(string Cedula) : IRequest<ClientAccessResult?>;

    public record ClientAccessResult(string Token, string Nombre, string Email, Guid ClientId);

    public class ClientAccessCommandHandler : IRequestHandler<ClientAccessCommand, ClientAccessResult?>
    {
        private readonly IClientRepository _clientRepository;
        private readonly IJwtService _jwtService;

        public ClientAccessCommandHandler(IClientRepository clientRepository, IJwtService jwtService)
        {
            _clientRepository = clientRepository;
            _jwtService = jwtService;
        }

        public async Task<ClientAccessResult?> Handle(ClientAccessCommand request, CancellationToken cancellationToken)
        {
            var clients = await _clientRepository.ListAsync(cancellationToken);
            var client = clients.FirstOrDefault(c => c.Cedula == request.Cedula);
            if (client is null) return null;

            var token = _jwtService.GenerateClientAccessToken(client);

            return new ClientAccessResult(token, client.Nombre, client.Email, client.Id);
        }
    }
}
