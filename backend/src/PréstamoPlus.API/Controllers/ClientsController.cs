using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Clients.Commands.UpdateClient;
using PréstamoPlus.Application.Features.Clients.Commands.RegisterClient;
using PréstamoPlus.Application.Features.Clients.Queries.GetAllClients;
using PréstamoPlus.Application.Features.Clients.Queries.GetClientById;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ClientsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(IReadOnlyList<ClientDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? estado)
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetAllClientsQuery(search, estado, tenantId));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetClientByIdQuery(id));
            if (result is null) return NotFound();
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || result.TenantId != tenantId) return NotFound();
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMe()
        {
            var clientIdClaim = User.FindFirst("clientId")?.Value;
            if (string.IsNullOrEmpty(clientIdClaim) || !Guid.TryParse(clientIdClaim, out var clientId))
                return Unauthorized(new { message = "Token de cliente inválido" });

            var result = await _mediator.Send(new GetClientByIdQuery(clientId));
            if (result is null || !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || result.TenantId != tenantId) return NotFound();
            return Ok(result);
        }

        [HttpGet("me/loans")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [ProducesResponseType(typeof(IReadOnlyList<LoanDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyLoans()
        {
            var clientIdClaim = User.FindFirst("clientId")?.Value;
            if (string.IsNullOrEmpty(clientIdClaim) || !Guid.TryParse(clientIdClaim, out var clientId))
                return Unauthorized(new { message = "Token de cliente inválido" });

            var allLoans = await _mediator.Send(new GetAllLoansQuery());
            var myLoans = allLoans.Where(l => l.ClientId == clientId).ToList();
            return Ok(myLoans);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> Register([FromBody] RegisterClientRequest request)
        {
            var result = await _mediator.Send(new RegisterClientCommand(request));
            return Created(string.Empty, result);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ManageClients)]
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
