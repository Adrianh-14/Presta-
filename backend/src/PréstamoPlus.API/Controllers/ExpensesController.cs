using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Expenses.Commands.CreateExpense;
using PréstamoPlus.Application.Features.Expenses.Commands.DeleteExpense;
using PréstamoPlus.Application.Features.Expenses.Commands.UpdateExpense;
using PréstamoPlus.Application.Features.Expenses.Queries.GetExpenses;
using PréstamoPlus.Application.Features.Expenses.Queries.GetFinancialSummary;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ExpensesController(IMediator mediator)
        {
            _mediator = mediator;
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
        [Authorize(Policy = AuthorizationPolicies.ReadFinancial)]
        [ProducesResponseType(typeof(List<ExpenseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? category)
        {
            var result = await _mediator.Send(new GetExpensesQuery(GetTenantId(), from, to, category));
            return Ok(result);
        }

        [HttpGet("summary")]
        [Authorize(Policy = AuthorizationPolicies.ReadFinancial)]
        [ProducesResponseType(typeof(FinancialSummaryDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSummary()
        {
            var result = await _mediator.Send(new GetFinancialSummaryQuery(GetTenantId()));
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.ManageExpenses)]
        [ProducesResponseType(typeof(ExpenseDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] CreateExpenseRequest request)
        {
            var result = await _mediator.Send(new CreateExpenseCommand(request, GetTenantId(), GetUserId()));
            return CreatedAtAction(nameof(GetAll), result);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ManageExpenses)]
        [ProducesResponseType(typeof(ExpenseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExpenseRequest request)
        {
            var result = await _mediator.Send(new UpdateExpenseCommand(id, request, GetTenantId()));
            return Ok(result);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ManageExpenses)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _mediator.Send(new DeleteExpenseCommand(id, GetTenantId()));
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
