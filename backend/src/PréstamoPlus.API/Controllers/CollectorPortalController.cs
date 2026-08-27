using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Cobradores.Commands.RecordVisit;
using PréstamoPlus.Application.Features.Cobradores.Queries.GetCollectorDashboard;
using PréstamoPlus.Application.Features.PaymentQR.Commands.GeneratePaymentQR;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/collector")]
    [Authorize(Policy = AuthorizationPolicies.CollectorPortal)]
    public class CollectorPortalController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CollectorPortalController(IMediator mediator)
        {
            _mediator = mediator;
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
    }
}
