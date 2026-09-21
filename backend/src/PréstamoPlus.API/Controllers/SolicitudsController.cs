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
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Application.Features.Solicituds.Specifications;
using PréstamoPlus.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SolicitudsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly ApplicationDbContext _db;

        public SolicitudsController(IMediator mediator, IUnitOfWork unitOfWork, INotificationService notificationService, ApplicationDbContext db)
        {
            _mediator = mediator;
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _db = db;
        }

        [HttpPost]
        [AllowAnonymous]
        [EnableRateLimiting("public-form")]
        [RequestSizeLimit(70 * 1024 * 1024)]
        [ProducesResponseType(typeof(LoanApplicationDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateSolicitudRequest request, CancellationToken cancellationToken)
        {
            var email = request.Client?.Email?.Trim().ToLowerInvariant();
            var verified = !string.IsNullOrWhiteSpace(email) && await _db.EmailVerificationCodes.AnyAsync(
                x => x.Email == email && x.Purpose == "client-registration" && x.VerifiedAt != null && x.VerifiedAt > DateTime.UtcNow.AddMinutes(-30), cancellationToken);
            if (!verified) return BadRequest(new { message = "Debes verificar el correo del cliente antes de enviar la solicitud." });
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
            // ASP.NET puede mapear el claim JWT `sub` a NameIdentifier.
            // Aceptamos ambas formas para que la aprobación no falle con 500.
            var actorClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            var result = await _mediator.Send(new UpdateSolicitudCommand(
                id,
                request.Estado,
                Guid.TryParse(actorClaim, out var actorUserId) ? actorUserId : null,
                request.FechaInicio,
                request.FechaPrimerPago,
                request.Instrucciones,
                request.MontoAprobado,
                request.TasaInteresMensual,
                request.GastoCierrePorcentaje,
                request.Plazo,
                request.UnidadPlazo,
                request.FrecuenciaPago,
                request.FrecuenciaInteres,
                request.Modalidad,
                request.RecalcularInteresSobreSaldo));
            if (result is null) return Accepted(new { message = "Primera aprobación registrada. Requiere un segundo aprobador." });
            return Ok(result);
        }

        [HttpGet("decision/{id:guid}")]
        [AllowAnonymous]
        [EnableRateLimiting("public-form")]
        public async Task<IActionResult> GetClientDecision(Guid id, [FromQuery] string token, CancellationToken cancellationToken)
        {
            var application = await _unitOfWork.LoanApplications.FirstOrDefaultAsync(
                new LoanApplicationByIdWithClientSpec(id, asNoTracking: true), cancellationToken);
            if (application is null || string.IsNullOrWhiteSpace(token) || application.ClientDecisionToken != token || application.Estado is not (EstadoSolicitud.Contraoferta or EstadoSolicitud.Procesando))
                return NotFound(new { message = "La propuesta no está disponible o el enlace no es válido." });

            return Ok(new
            {
                application.Id,
                application.MontoSolicitado,
                application.Moneda,
                application.TasaInteresMensual,
                application.Plazo,
                application.UnidadPlazo,
                application.FrecuenciaPago,
                application.FrecuenciaInteres,
                application.Modalidad,
                application.GastoCierrePorcentaje,
                application.CuotaEstimada,
                application.TotalPagar,
                Cliente = application.Client?.Nombre
            });
        }

        [HttpPost("decision/{id:guid}")]
        [AllowAnonymous]
        [EnableRateLimiting("public-form")]
        public async Task<IActionResult> DecideAsClient(Guid id, [FromBody] ClientDecisionRequest request, CancellationToken cancellationToken)
        {
            var application = await _unitOfWork.LoanApplications.FirstOrDefaultAsync(
                new LoanApplicationByIdWithClientSpec(id, asNoTracking: false), cancellationToken);
            if (application is null || string.IsNullOrWhiteSpace(request.Token) || application.ClientDecisionToken != request.Token || application.Estado is not (EstadoSolicitud.Contraoferta or EstadoSolicitud.Procesando))
                return NotFound(new { message = "La propuesta no está disponible o el enlace no es válido." });

            application.ClientDecisionAt = DateTime.UtcNow;
            application.Estado = request.Approved ? EstadoSolicitud.ClienteAprobada : EstadoSolicitud.Rechazada;
            await _unitOfWork.LoanApplications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Ok(new { approved = request.Approved, status = application.Estado.ToString() });
        }

        [HttpPost("{id:guid}/reenviar-contraoferta")]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        public async Task<IActionResult> ResendCounterOffer(Guid id, [FromBody] UpdateEstadoRequest? request, CancellationToken cancellationToken)
        {
            var current = await _mediator.Send(new GetSolicitudByIdQuery(id), cancellationToken);
            if (current is null) return NotFound();
            if (current.Estado is not (EstadoSolicitud.Contraoferta or EstadoSolicitud.Procesando))
                return BadRequest(new { message = "Solo se puede reenviar una contraoferta pendiente del cliente." });

            var result = await _mediator.Send(new UpdateSolicitudCommand(
                id,
                EstadoSolicitud.Contraoferta,
                null,
                request?.FechaInicio,
                request?.FechaPrimerPago,
                request?.Instrucciones,
                request?.MontoAprobado,
                request?.TasaInteresMensual,
                request?.GastoCierrePorcentaje,
                request?.Plazo,
                request?.UnidadPlazo,
                request?.FrecuenciaPago,
                request?.FrecuenciaInteres,
                request?.Modalidad,
                request?.RecalcularInteresSobreSaldo), cancellationToken);
            return Ok(new { message = "Contraoferta reenviada al correo del cliente.", solicitud = result });
        }

        public sealed record ClientDecisionRequest(string Token, bool Approved);
    }
}
