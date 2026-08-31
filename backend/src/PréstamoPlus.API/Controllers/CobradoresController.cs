using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Cobradores.Commands.AssignLoans;
using PréstamoPlus.Application.Features.Cobradores.Commands.CreateCollector;
using PréstamoPlus.Application.Features.Cobradores.Commands.RecordVisit;
using PréstamoPlus.Application.Features.Cobradores.Queries.GetAllCollectors;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Consultar la lista y sus detalles no debe exigir step-up authentication.
    // Las operaciones que modifican datos mantienen ManageCollectors debajo.
    [Authorize(Policy = AuthorizationPolicies.StaffRead)]
    public class CobradoresController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUnitOfWork _unitOfWork;

        public CobradoresController(IMediator mediator, IUnitOfWork unitOfWork)
        {
            _mediator = mediator;
            _unitOfWork = unitOfWork;
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenantId")?.Value;
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }

        private Guid GetUserId()
        {
            var claim = System.Security.Claims.ClaimTypes.NameIdentifier;
            var sub = User.FindFirst(claim)?.Value ?? User.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<CollectorDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAllCollectorsQuery(GetTenantId()));
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
        [ProducesResponseType(typeof(CollectorDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] CreateCollectorRequest request)
        {
            var result = await _mediator.Send(new CreateCollectorCommand(request, GetTenantId()));
            return CreatedAtAction(nameof(GetAll), result);
        }

        [HttpPost("{id:guid}/assign")]
        [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
        [ProducesResponseType(typeof(List<CollectionAssignmentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> AssignLoans(Guid id, [FromBody] AssignLoansRequest request)
        {
            var result = await _mediator.Send(new AssignLoansCommand(
                id,
                request,
                GetUserId(),
                GetTenantId()));
            return Ok(result);
        }

        [HttpPatch("{id:guid}/status")]
        [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
        public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleCollectorStatusRequest request)
        {
            var collector = await _unitOfWork.Collectors.GetByIdAsync(id);
            if (collector is null || collector.TenantId != GetTenantId())
                return NotFound(new { message = "Cobrador no encontrado." });

            collector.IsActive = request.IsActive;
            await _unitOfWork.Collectors.UpdateAsync(collector);
            var user = await _unitOfWork.Users.GetByIdAsync(collector.UserId);
            if (user is not null)
            {
                user.IsActive = request.IsActive;
                await _unitOfWork.Users.UpdateAsync(user);
            }
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { collectorId = id, isActive = request.IsActive });
        }

        [HttpDelete("assignments/{assignmentId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
        public async Task<IActionResult> RemoveAssignment(Guid assignmentId)
        {
            var assignment = (await _unitOfWork.CollectionAssignments.ListAsync())
                .FirstOrDefault(a => a.Id == assignmentId);
            if (assignment is null) return NotFound(new { message = "Asignación no encontrada." });

            var collector = await _unitOfWork.Collectors.GetByIdAsync(assignment.CollectorId);
            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            if (collector?.TenantId != GetTenantId() || loan?.TenantId != GetTenantId())
                return NotFound(new { message = "Asignación no encontrada." });

            await _unitOfWork.CollectionAssignments.DeleteAsync(assignment);
            await _unitOfWork.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("assignments/{assignmentId:guid}/qr-authorization")]
        [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ToggleQRAuthorization(Guid assignmentId, [FromBody] ToggleQRAuthorizationRequest request)
        {
            var assignments = await _unitOfWork.CollectionAssignments.ListAsync();
            var assignment = assignments.FirstOrDefault(a => a.Id == assignmentId);

            if (assignment is null)
                return NotFound(new { message = "Asignación no encontrada." });

            var collector = await _unitOfWork.Collectors.GetByIdAsync(assignment.CollectorId);
            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            if (collector?.TenantId != GetTenantId() || loan?.TenantId != GetTenantId())
                return NotFound(new { message = "Asignación no encontrada." });

            assignment.IsQRAuthorized = request.IsQRAuthorized;
            if (request.IsQRAuthorized)
            {
                assignment.QRGenerationAttempts = 0;
                assignment.QRPermissionRequested = false;
            }
            await _unitOfWork.CollectionAssignments.UpdateAsync(assignment);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { assignmentId, isQRAuthorized = assignment.IsQRAuthorized });
        }

        [HttpGet("{id:guid}/assignments")]
        [ProducesResponseType(typeof(List<CollectionAssignmentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAssignments(Guid id)
        {
            var collector = await _unitOfWork.Collectors.GetByIdAsync(id);
            if (collector?.TenantId != GetTenantId()) return NotFound();

            var assignments = await _unitOfWork.CollectionAssignments.ListAsync();
            var collectorAssignments = assignments.Where(a => a.CollectorId == id).ToList();

            var result = new List<CollectionAssignmentDto>();
            foreach (var a in collectorAssignments)
            {
                var loan = await _unitOfWork.Loans.GetByIdAsync(a.LoanId);
                var client = loan is not null ? await _unitOfWork.Clients.GetByIdAsync(loan.ClientId) : null;
                if (loan?.TenantId != GetTenantId() || client?.TenantId != GetTenantId()) continue;
                result.Add(new CollectionAssignmentDto
                {
                    Id = a.Id,
                    CollectorId = a.CollectorId,
                    LoanId = a.LoanId,
                    ClienteNombre = client?.Nombre ?? "",
                    ClienteCedula = client?.Cedula ?? "",
                    ClienteTelefono = client?.Telefono ?? "",
                    MontoOriginal = loan?.MontoOriginal ?? 0,
                    CuotaMensual = loan?.CuotaMensual ?? 0,
                    SaldoPendiente = loan?.SaldoPendiente ?? 0,
                    Frecuencia = loan?.FrecuenciaPago ?? Domain.Enums.FrecuenciaPago.Mensual,
                    EstadoPrestamo = loan?.Estado ?? Domain.Enums.EstadoPrestamo.Activo,
                    Estado = a.Estado,
                    IsQRAuthorized = a.IsQRAuthorized,
                    QRGenerationAttempts = a.QRGenerationAttempts,
                    QRPermissionRequested = a.QRPermissionRequested,
                    AssignedAt = a.AssignedAt
                });
            }
            return Ok(result);
        }

        [HttpGet("assignments/{assignmentId:guid}/suggested-amount")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSuggestedAmount(Guid assignmentId)
        {
            var assignment = (await _unitOfWork.CollectionAssignments.ListAsync()).FirstOrDefault(a => a.Id == assignmentId);
            if (assignment is null) return NotFound();

            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            var collector = await _unitOfWork.Collectors.GetByIdAsync(assignment.CollectorId);
            if (loan?.TenantId != GetTenantId() || collector?.TenantId != GetTenantId()) return NotFound();

            var installments = await _unitOfWork.Installments.ListAsync();
            var unpaid = installments.Where(i => i.LoanId == loan.Id && i.Estado != Domain.Enums.EstadoInstallment.Pagado).ToList();

            decimal cuota = loan.CuotaMensual;
            decimal moras = 0;

            var lateFees = await _unitOfWork.LateFees.ListAsync();
            var unpaidLateFees = lateFees.Where(lf => lf.LoanId == loan.Id && !lf.Pagado && lf.Monto > 0).ToList();
            moras = unpaidLateFees.Sum(lf => lf.Monto);

            return Ok(new { cuotaMensual = cuota, morasPendientes = moras, totalSugerido = cuota + moras });
        }
    }

    public record ToggleQRAuthorizationRequest(bool IsQRAuthorized);
    public record ToggleCollectorStatusRequest(bool IsActive);
}
