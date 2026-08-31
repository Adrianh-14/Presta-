using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Prestamos.Commands.UpdateLoanStatus;
using PréstamoPlus.Application.Features.Prestamos.Commands.CreateDirectLoan;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAmortization;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetLoanById;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrestamosController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PrestamosController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.StaffRead)]
        [ProducesResponseType(typeof(IReadOnlyList<LoanDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? estado, [FromQuery] string? tipo)
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetAllLoansQuery(search, estado, tipo, tenantId));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.StaffOrClientRead)]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetLoanByIdQuery(id));
            if (result is null) return NotFound();
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || result.TenantId != tenantId) return NotFound();
            if (!CanReadLoan(result.ClientId)) return NotFound();
            return Ok(result);
        }

        [HttpGet("{id:guid}/amortization")]
        [Authorize(Policy = AuthorizationPolicies.StaffOrClientRead)]
        [ProducesResponseType(typeof(IReadOnlyList<AmortizationRowDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAmortization(Guid id)
        {
            var loan = await _mediator.Send(new GetLoanByIdQuery(id));
            if (loan is null || !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || loan.TenantId != tenantId || !CanReadLoan(loan.ClientId)) return NotFound();

            var result = await _mediator.Send(new GetAmortizationQuery(id));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPatch("{id:guid}/estado")]
        [Authorize(Policy = AuthorizationPolicies.ManageLoans)]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEstado(Guid id, [FromBody] string estado)
        {
            if (!Enum.TryParse<Domain.Enums.EstadoPrestamo>(estado, true, out var estadoEnum))
                return BadRequest(new { message = "Estado inválido" });

            var result = await _mediator.Send(new UpdateLoanStatusCommand(id, estadoEnum));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPost("direct")]
        [Authorize(Policy = AuthorizationPolicies.ManageLoans)]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateDirect([FromBody] CreateDirectLoanRequest request)
        {
            try
            {
                var result = await _mediator.Send(new CreateDirectLoanCommand(request));
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Capital insuficiente", StringComparison.OrdinalIgnoreCase))
            {
                // La falta de capital es una validación de negocio esperable, no un fallo del servidor.
                return BadRequest(new { message = ex.Message, code = "INSUFFICIENT_CAPITAL" });
            }
        }

        private bool CanReadLoan(Guid clientId)
        {
            if (!User.IsInRole(SystemRoles.Cliente)) return true;
            return Guid.TryParse(User.FindFirst("clientId")?.Value, out var authenticatedClientId) &&
                   authenticatedClientId == clientId;
        }
    }
}
