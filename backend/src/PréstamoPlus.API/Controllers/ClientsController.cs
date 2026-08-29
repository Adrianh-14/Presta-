using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Features.Clients.Commands.UpdateClient;
using PréstamoPlus.Application.Features.Clients.Commands.RegisterClient;
using PréstamoPlus.Application.Features.Clients.Queries.GetAllClients;
using PréstamoPlus.Application.Features.Clients.Queries.GetClientById;
using PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary;
using PréstamoPlus.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ApplicationDbContext _db;

        public ClientsController(IMediator mediator, ApplicationDbContext db)
        {
            _mediator = mediator;
            _db = db;
        }

        [HttpGet]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(IReadOnlyList<ClientDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? estado)
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var result = await _mediator.Send(new GetAllClientsQuery(search, estado, tenantId));
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ReadPii)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetClientByIdQuery(id));
            if (result is null) return NotFound();
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || result.TenantId != tenantId) return NotFound();
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMe()
        {
            var clientIdClaim = User.FindFirst("clientId")?.Value;
            if (string.IsNullOrEmpty(clientIdClaim) || !Guid.TryParse(clientIdClaim, out var clientId))
                return Unauthorized(new { message = "Token de cliente inválido" });

            var result = await _mediator.Send(new GetClientByIdQuery(clientId));
            if (result is null || !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || result.TenantId != tenantId) return NotFound();
            return Ok(result);
        }

        [HttpGet("me/loans")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [ProducesResponseType(typeof(IReadOnlyList<LoanDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyLoans()
        {
            var clientIdClaim = User.FindFirst("clientId")?.Value;
            if (string.IsNullOrEmpty(clientIdClaim) || !Guid.TryParse(clientIdClaim, out var clientId))
                return Unauthorized(new { message = "Token de cliente inválido" });

            var allLoans = await _mediator.Send(new GetAllLoansQuery());
            var myLoans = allLoans.Where(l => l.ClientId == clientId).ToList();
            return Ok(myLoans);
        }

        [HttpGet("me/solicitudes")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
            var applications = await _db.LoanApplications.AsNoTracking()
                .Include(x => x.VerificationMedia)
                .Where(x => x.ClientId == clientId)
                .OrderByDescending(x => x.FechaSolicitud)
                .Select(x => new { x.Id, x.MontoSolicitado, x.Estado, x.FechaSolicitud, GarantiaPath = x.VerificationMedia == null ? null : x.VerificationMedia.GarantiaPath })
                .ToListAsync(cancellationToken);
            return Ok(applications);
        }

        [HttpPost("me/solicitudes/{id:guid}/garantia")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [RequestSizeLimit(8 * 1024 * 1024)]
        public async Task<IActionResult> UploadGuarantee(Guid id, [FromBody] GuaranteeUploadRequest request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
            var application = await _db.LoanApplications.Include(x => x.VerificationMedia).FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId, cancellationToken);
            if (application is null) return NotFound();
            if (string.IsNullOrWhiteSpace(request.Image)) return BadRequest(new { message = "La imagen de garantía es obligatoria." });
            var data = request.Image;
            var mime = "image/jpeg";
            if (data.StartsWith("data:")) { var parts = data.Split(',', 2); mime = parts[0].Split(':')[1].Split(';')[0]; data = parts.Length > 1 ? parts[1] : ""; }
            if (mime is not ("image/jpeg" or "image/png" or "image/webp")) return BadRequest(new { message = "Formato de garantía no permitido." });
            byte[] bytes;
            try { bytes = Convert.FromBase64String(data); } catch { return BadRequest(new { message = "La imagen de garantía no es válida." }); }
            if (bytes.Length > 5 * 1024 * 1024) return BadRequest(new { message = "La imagen excede 5MB." });
            var uploadsDir = Environment.GetEnvironmentVariable("UPLOADS_PATH") ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "uploads"));
            Directory.CreateDirectory(uploadsDir);
            var extension = mime == "image/png" ? ".png" : mime == "image/webp" ? ".webp" : ".jpg";
            var fileName = $"{application.Id}_garantia{extension}";
            await System.IO.File.WriteAllBytesAsync(Path.Combine(uploadsDir, fileName), bytes, cancellationToken);
            application.VerificationMedia ??= new Domain.Entities.VerificationMedia { Id = Guid.NewGuid(), LoanApplicationId = application.Id };
            application.VerificationMedia.GarantiaPath = fileName;
            if (application.Estado == Domain.Enums.EstadoSolicitud.Pendiente) application.Estado = Domain.Enums.EstadoSolicitud.Procesando;
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Garantía recibida. La solicitud pasó a procesamiento.", estado = application.Estado, garantiaPath = fileName });
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("public-form")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status201Created)]
        public async Task<IActionResult> Register([FromBody] RegisterClientRequest request)
        {
            try
            {
                var result = await _mediator.Send(new RegisterClientCommand(request));
                return Created(string.Empty, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = AuthorizationPolicies.ManageClients)]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClientDto data)
        {
            var result = await _mediator.Send(new UpdateClientCommand(id, data));
            if (result is null) return NotFound();
            return Ok(result);
        }
    }

    public sealed record GuaranteeUploadRequest(string Image);
}
