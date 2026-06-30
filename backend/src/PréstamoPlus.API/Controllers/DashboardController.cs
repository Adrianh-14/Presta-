using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetDashboardStats;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByMonth;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByType;
using PréstamoPlus.Application.Features.Dashboard.Queries.GetCollections;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            var result = await _mediator.Send(new GetDashboardStatsQuery());
            return Ok(result);
        }

        [HttpGet("loans-by-month")]
        [ProducesResponseType(typeof(IReadOnlyList<LoansByMonthDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoansByMonth()
        {
            var result = await _mediator.Send(new GetLoansByMonthQuery());
            return Ok(result);
        }

        [HttpGet("loans-by-type")]
        [ProducesResponseType(typeof(IReadOnlyList<LoansByTypeDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoansByType()
        {
            var result = await _mediator.Send(new GetLoansByTypeQuery());
            return Ok(result);
        }

        [HttpGet("collections")]
        [ProducesResponseType(typeof(CollectionsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCollections()
        {
            var result = await _mediator.Send(new GetCollectionsQuery());
            return Ok(result);
        }
    }
}
