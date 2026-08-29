using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Solicituds.Commands.CreateSolicitud;
using PréstamoPlus.Application.Features.Solicituds.Commands.UpdateSolicitud;
using PréstamoPlus.Application.Features.Solicituds.Queries.GetAllSolicituds;
using PréstamoPlus.Application.Features.Solicituds.Queries.GetSolicitudById;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SolicitudsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SolicitudsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        [AllowAnonymous]
        [EnableRateLimiting("public-form")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        [ProducesResponseType(typeof(LoanApplicationDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateSolicitudRequest request)
        {
            var tenantIdClaim = User?.FindFirst("tenantId")?.Value;
            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                request = request with { TenantId = tenantId };
            }

            try
            {
                var command = new CreateSolicitudCommand(request);
                var result = await _mediator.Send(command);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(LoanApplicationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetSolicitudByIdQuery(id));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(IReadOnlyList<LoanApplicationDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var tenantIdClaim = User?.FindFirst("tenantId")?.Value;
            if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                return Forbid();
            }

            var result = await _mediator.Send(new GetAllSolicitudsQuery(tenantId));
            return Ok(result);
        }

        [HttpPatch("{id:guid}/estado")]
        [Authorize(Policy = AuthorizationPolicies.ApproveApplications)]
        [ProducesResponseType(typeof(LoanApplicationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEstado(Guid id, [FromBody] UpdateEstadoRequest request)
        {
            var current = await _mediator.Send(new GetSolicitudByIdQuery(id));
            if (current is null) return NotFound();
            var result = await _mediator.Send(new UpdateSolicitudCommand(
                id,
                request.Estado,
                Guid.TryParse(User.FindFirst("sub")?.Value, out var actorUserId) ? actorUserId : null,
                request.FechaInicio,
                request.FechaPrimerPago,
                request.Instrucciones,
                request.MontoAprobado,
                request.TasaInteresMensual,
                request.GastoCierrePorcentaje,
                request.Plazo,
                request.UnidadPlazo,
                request.FrecuenciaPago));
            if (result is null) return Accepted(new { message = "Primera aprobación registrada. Requiere un segundo aprobador." });
            return Ok(result);
        }
    }
}
