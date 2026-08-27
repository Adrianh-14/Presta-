using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetDashboardStats;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByMonth;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByType;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetCollections;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = AuthorizationPolicies.StaffRead)]
    public class DashboardController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DashboardController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("stats")]
        [ProducesResponseType(typeof(DashboardStatsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStats()
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetDashboardStatsQuery(tenantId));
            return Ok(result);
        }

        [HttpGet("loans-by-month")]
        [ProducesResponseType(typeof(IReadOnlyList<LoansByMonthDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoansByMonth()
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetLoansByMonthQuery(tenantId));
            return Ok(result);
        }

        [HttpGet("loans-by-type")]
        [ProducesResponseType(typeof(IReadOnlyList<LoansByTypeDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoansByType()
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetLoansByTypeQuery(tenantId));
            return Ok(result);
        }

        [HttpGet("collections")]
        [ProducesResponseType(typeof(CollectionsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCollections()
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetCollectionsQuery(tenantId));
            return Ok(result);
        }
    }
}
