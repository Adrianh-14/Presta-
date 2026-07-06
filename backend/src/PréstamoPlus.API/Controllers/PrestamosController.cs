using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Prestamos.Commands.UpdateLoanStatus;
using PréstamoPlus.Application.Features.Prestamos.Commands.CreateDirectLoan;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAmortization;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetLoanById;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrestamosController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PrestamosController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyList<LoanDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? estado, [FromQuery] string? tipo)
        {
            var result = await _mediator.Send(new GetAllLoansQuery(search, estado, tipo));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetLoanByIdQuery(id));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpGet("{id:guid}/amortization")]
        [ProducesResponseType(typeof(IReadOnlyList<AmortizationRowDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAmortization(Guid id)
        {
            var result = await _mediator.Send(new GetAmortizationQuery(id));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPatch("{id:guid}/estado")]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEstado(Guid id, [FromBody] string estado)
        {
            if (!Enum.TryParse<Domain.Enums.EstadoPrestamo>(estado, true, out var estadoEnum))
                return BadRequest(new { message = "Estado inválido" });

            var result = await _mediator.Send(new UpdateLoanStatusCommand(id, estadoEnum));
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpPost("direct")]
        [ProducesResponseType(typeof(LoanDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateDirect([FromBody] CreateDirectLoanRequest request)
        {
            var result = await _mediator.Send(new CreateDirectLoanCommand(request));
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
    }
}
