using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Payments.Commands.CreateMoraPayment;
using PréstamoPlus.Application.Features.Payments.Commands.CreatePayment;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentsByLoanId;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetLoanById;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PaymentsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.RecordPayments)]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
        {
            if (!await CanReadLoanAsync(request.LoanId) || User.IsInRole(SystemRoles.Cliente)) return Forbid();
            var result = await _mediator.Send(new CreatePaymentCommand(request));
            return CreatedAtAction(nameof(GetByLoanId), new { loanId = result.LoanId }, result);
        }

        [HttpGet("loan/{loanId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.StaffOrClientRead)]
        [ProducesResponseType(typeof(IReadOnlyList<PaymentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetByLoanId(Guid loanId)
        {
            if (!await CanReadLoanAsync(loanId)) return NotFound();
            var result = await _mediator.Send(new GetPaymentsByLoanIdQuery(loanId));
            return Ok(result);
        }

        [HttpGet("loan/{loanId:guid}/summary")]
        [Authorize(Policy = AuthorizationPolicies.StaffOrClientRead)]
        [ProducesResponseType(typeof(PaymentSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSummary(Guid loanId)
        {
            if (!await CanReadLoanAsync(loanId)) return NotFound();
            var result = await _mediator.Send(new GetPaymentSummaryQuery(loanId));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPost("mora")]
        [Authorize(Policy = AuthorizationPolicies.RecordPayments)]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateMoraPayment([FromBody] CreateMoraPaymentRequest request)
        {
            if (!await CanReadLoanAsync(request.LoanId) || User.IsInRole(SystemRoles.Cliente)) return Forbid();
            var result = await _mediator.Send(new CreateMoraPaymentCommand(request));
            return CreatedAtAction(nameof(GetByLoanId), new { loanId = result.LoanId }, result);
        }

        private async Task<bool> CanReadLoanAsync(Guid loanId)
        {
            var loan = await _mediator.Send(new GetLoanByIdQuery(loanId));
            if (loan is null) return false;
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || loan.TenantId != tenantId)
                return false;
            if (!User.IsInRole(SystemRoles.Cliente)) return true;
            return Guid.TryParse(User.FindFirst("clientId")?.Value, out var authenticatedClientId) &&
                   authenticatedClientId == loan.ClientId;
        }
    }
}
