using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Clients.Commands.UpdateClient;
using PréstamoPlus.Application.Features.Clients.Queries.GetAllClients;
using PréstamoPlus.Application.Features.Clients.Queries.GetClientById;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ClientsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyList<ClientDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? estado)
        {
            var result = await _mediator.Send(new GetAllClientsQuery(search, estado));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetClientByIdQuery(id));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPut("{id:guid}")]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClientDto data)
        {
            var result = await _mediator.Send(new UpdateClientCommand(id, data));
            if (result is null) return NotFound();
            return Ok(result);
        }
    }
}
