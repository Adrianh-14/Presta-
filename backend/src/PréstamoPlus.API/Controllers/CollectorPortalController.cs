using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Cobradores.Commands.RecordVisit;
using PréstamoPlus.Application.Features.Cobradores.Queries.GetCollectorDashboard;
using PréstamoPlus.Application.Features.PaymentQR.Commands.GeneratePaymentQR;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/collector")]
    [Authorize(Policy = AuthorizationPolicies.CollectorPortal)]
    public class CollectorPortalController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUnitOfWork _unitOfWork;

        public CollectorPortalController(IMediator mediator, IUnitOfWork unitOfWork)
        {
            _mediator = mediator;
            _unitOfWork = unitOfWork;
        }

        private Guid GetCollectorId()
        {
            var claim = User.FindFirst("collectorId")?.Value;
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(CollectorDashboardDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard()
        {
            var result = await _mediator.Send(new GetCollectorDashboardQuery(GetCollectorId()));
            return Ok(result);
        }

        [HttpGet("collections")]
        [ProducesResponseType(typeof(List<CollectionAssignmentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCollections()
        {
            var dashboard = await _mediator.Send(new GetCollectorDashboardQuery(GetCollectorId()));
            return Ok(dashboard.Asignaciones);
        }

        [HttpPost("collections/{assignmentId:guid}/visit")]
        [ProducesResponseType(typeof(CollectionVisitDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> RecordVisit(Guid assignmentId, [FromBody] RecordVisitRequest request)
        {
            var result = await _mediator.Send(new RecordVisitCommand(GetCollectorId(), assignmentId, request));
            return Ok(result);
        }

        [HttpPost("generate-qr")]
        [ProducesResponseType(typeof(PaymentQRDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GenerateQR([FromBody] GeneratePaymentQRRequest request)
        {
            var result = await _mediator.Send(new GeneratePaymentQRCommand(request, GetCollectorId()));
            return Ok(result);
        }

        [HttpGet("assignments/{assignmentId:guid}/suggested-amount")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSuggestedAmount(Guid assignmentId)
        {
            var collectorId = GetCollectorId();
            var assignment = (await _unitOfWork.CollectionAssignments.ListAsync())
                .FirstOrDefault(a => a.Id == assignmentId && a.CollectorId == collectorId);
            if (assignment is null) return NotFound(new { message = "Asignación no encontrada." });

            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            if (loan is null) return NotFound(new { message = "Préstamo no encontrado." });

            var installments = await _unitOfWork.Installments.ListAsync();
            var lateFees = await _unitOfWork.LateFees.ListAsync();
            var moras = lateFees
                .Where(lf => lf.LoanId == loan.Id && !lf.Pagado && lf.Monto > 0)
                .Sum(lf => lf.Monto);

            return Ok(new
            {
                cuotaMensual = loan.CuotaMensual,
                morasPendientes = moras,
                totalSugerido = loan.CuotaMensual + moras,
                cuotasPendientes = installments.Count(i => i.LoanId == loan.Id && i.Estado != Domain.Enums.EstadoInstallment.Pagado)
            });
        }
    }
}
