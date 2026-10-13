using MediatR;
using Microsoft.EntityFrameworkCore;
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
            try
            {
                var result = await _mediator.Send(new GeneratePaymentQRCommand(request, GetCollectorId()));
                return Ok(result);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "Se generó un QR al mismo tiempo. Actualiza la lista de intentos y vuelve a intentarlo." });
            }
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
            var pendingInstallments = installments
                .Where(i => i.LoanId == loan.Id && i.Estado != Domain.Enums.EstadoInstallment.Pagado)
                .ToList();
            var capitalPendiente = pendingInstallments.Sum(i => Math.Max(0, i.Capital - i.CapitalPagado));
            var interesesPendientes = pendingInstallments.Sum(i => Math.Max(0, i.Interes - i.InteresPagado));
            var totalLiquidacion = capitalPendiente + interesesPendientes + moras;

            return Ok(new
            {
                cuotaMensual = loan.CuotaMensual,
                morasPendientes = moras,
                totalSugerido = loan.CuotaMensual + moras,
                cuotasPendientes = pendingInstallments.Count,
                capitalPendiente,
                interesesPendientes,
                totalLiquidacion
            });
        }

        [HttpGet("assignments/{assignmentId:guid}/qr-installments")]
        public async Task<IActionResult> GetQrInstallments(Guid assignmentId)
        {
            var assignment = (await _unitOfWork.CollectionAssignments.ListAsync())
                .FirstOrDefault(item => item.Id == assignmentId && item.CollectorId == GetCollectorId());
            if (assignment is null || !assignment.IsQRAuthorized)
                return NotFound(new { message = "No tienes cuotas autorizadas para cobrar por QR." });
            var authorized = assignment.AuthorizedQRInstallments
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => int.TryParse(value, out var number) ? number : 0)
                .Where(number => number > 0)
                .ToHashSet();
            var installments = (await _unitOfWork.Installments.ListAsync())
                .Where(item => item.LoanId == assignment.LoanId && authorized.Contains(item.Numero))
                .OrderBy(item => item.Numero)
                .ToList();
            var qrs = (await _unitOfWork.PaymentQRs.ListAsync()).Where(qr => qr.AssignmentId == assignmentId).ToList();
            return Ok(installments.Select(item =>
            {
                var amountDue = Math.Max(0, item.Capital - item.CapitalPagado) + Math.Max(0, item.Interes - item.InteresPagado);
                var attemptsUsed = qrs.Count(qr => qr.InstallmentNumber == item.Numero);
                return new
                {
                    installmentNumber = item.Numero,
                    dueDate = item.FechaPago,
                    amountDue,
                    attemptsUsed,
                    attemptsRemaining = Math.Max(0, 3 - attemptsUsed),
                    canGenerate = item.Estado != Domain.Enums.EstadoInstallment.Pagado && amountDue > 0 && attemptsUsed < 3
                };
            }));
        }
    }
}
