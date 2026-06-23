using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Payments.Commands.CreateMoraPayment;
using PréstamoPlus.Application.Features.Payments.Commands.CreatePayment;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentsByLoanId;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PaymentsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
        {
            var result = await _mediator.Send(new CreatePaymentCommand(request));
            return CreatedAtAction(nameof(GetByLoanId), new { loanId = result.LoanId }, result);
        }

        [HttpGet("loan/{loanId:guid}")]
        [ProducesResponseType(typeof(IReadOnlyList<PaymentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetByLoanId(Guid loanId)
        {
            var result = await _mediator.Send(new GetPaymentsByLoanIdQuery(loanId));
            return Ok(result);
        }

        [HttpGet("loan/{loanId:guid}/summary")]
        [ProducesResponseType(typeof(PaymentSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSummary(Guid loanId)
        {
            var result = await _mediator.Send(new GetPaymentSummaryQuery(loanId));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPost("mora")]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateMoraPayment([FromBody] CreateMoraPaymentRequest request)
        {
            var result = await _mediator.Send(new CreateMoraPaymentCommand(request));
            return CreatedAtAction(nameof(GetByLoanId), new { loanId = result.LoanId }, result);
        }
    }
}
