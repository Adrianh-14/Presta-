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
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Application.Features.Payments.Queries.GetPaymentSummary;
using PréstamoPlus.Domain;
using PréstamoPlus.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ApplicationDbContext _db;
        private readonly INotificationService _notificationService;
        private readonly IClientOtpDeliveryQueue _otpDeliveryQueue;
        private readonly IClientOtpSender _otpSender;
        private readonly ClientAuthenticationOptions _otpOptions;

        public ClientsController(IMediator mediator, ApplicationDbContext db, INotificationService notificationService,
            IClientOtpDeliveryQueue otpDeliveryQueue, IClientOtpSender otpSender, IOptions<ClientAuthenticationOptions> otpOptions)
        {
            _mediator = mediator;
            _db = db;
            _notificationService = notificationService;
            _otpDeliveryQueue = otpDeliveryQueue;
            _otpSender = otpSender;
            _otpOptions = otpOptions.Value;
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

        [HttpGet("me/profile-status")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        public async Task<IActionResult> GetMyProfileStatus(CancellationToken cancellationToken)
        {
            if (!TryGetPortalOwner(out var clientId, out var tenantId)) return Unauthorized();
            var client = await _db.Clients.AsNoTracking().SingleOrDefaultAsync(x => x.Id == clientId && x.TenantId == tenantId, cancellationToken);
            if (client is null) return NotFound();
            var config = await _db.TenantConfigs.AsNoTracking().SingleOrDefaultAsync(x => x.TenantId == tenantId, cancellationToken);
            var interval = Math.Clamp(config?.ClientProfileRefreshMonths ?? 6, 1, 24);
            var lastReviewed = client.ProfileReviewedAt ?? client.FechaRegistro;
            var dueAt = lastReviewed.AddMonths(interval);
            var pending = await _db.ClientProfileUpdateRequests.AsNoTracking().AnyAsync(x => x.ClientId == clientId && x.TenantId == tenantId && x.Status == "Pending", cancellationToken);
            var latest = await _db.ClientProfileUpdateRequests.AsNoTracking().Where(x => x.ClientId == clientId && x.TenantId == tenantId)
                .OrderByDescending(x => x.CreatedAt).Select(x => new { x.Status, x.ReviewNote, x.ReviewedAt }).FirstOrDefaultAsync(cancellationToken);
            var rejected = latest?.Status == "Rejected";
            return Ok(new { required = DateTime.UtcNow >= dueAt || pending || rejected, pendingReview = pending, latest?.Status, latest?.ReviewNote, latest?.ReviewedAt, refreshMonths = interval, lastReviewedAt = lastReviewed, dueAt });
        }

        [HttpPost("me/contact/email/request-otp")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [EnableRateLimiting("client-otp-request")]
        public async Task<IActionResult> RequestEmailChangeOtp([FromBody] ClientEmailChangeRequest request, CancellationToken cancellationToken)
        {
            if (!TryGetPortalOwner(out var clientId, out var tenantId)) return Unauthorized();
            var email = request.Email?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email) || email.Length > 254) return BadRequest(new { message = "Indica un correo válido." });
            try { if (!string.Equals(new MailAddress(email).Address, email, StringComparison.OrdinalIgnoreCase)) return BadRequest(new { message = "Indica un correo válido." }); }
            catch (FormatException) { return BadRequest(new { message = "Indica un correo válido." }); }
            if (!_otpSender.IsConfigured || string.IsNullOrWhiteSpace(_otpOptions.OtpPepper)) return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "La verificación de correo no está configurada." });
            var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId && x.TenantId == tenantId, cancellationToken);
            if (client is null) return NotFound();
            if (string.Equals(client.Email, email, StringComparison.OrdinalIgnoreCase)) return Conflict(new { message = "Ese ya es tu correo registrado." });
            if (await _db.Clients.AnyAsync(x => x.TenantId == tenantId && x.Id != clientId && x.Email.ToLower() == email, cancellationToken))
                return Conflict(new { message = "Ese correo ya está asociado a otro cliente de esta financiera." });
            var now = DateTime.UtcNow;
            var previous = await _db.ClientContactOtpChallenges.Where(x => x.ClientId == clientId && x.TenantId == tenantId && x.Purpose == "profile-email" && x.ConsumedAt == null).ToListAsync(cancellationToken);
            foreach (var item in previous) item.ConsumedAt = now;
            var id = Guid.NewGuid();
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            var challenge = new ClientContactOtpChallenge { Id = id, ClientId = clientId, TenantId = tenantId, Purpose = "profile-email", ValueHash = HashContactValue(email), CodeHash = HashContactCode(id, tenantId, clientId, code), CreatedAt = now, ExpiresAt = now.AddMinutes(10) };
            _db.ClientContactOtpChallenges.Add(challenge);
            await _db.SaveChangesAsync(cancellationToken);
            if (!_otpDeliveryQueue.TryQueue(new ClientOtpDelivery(email, client.Nombre, code, 10, "profile-email")))
            {
                challenge.ConsumedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "No pudimos enviar el código. Intenta de nuevo más tarde." });
            }
            return Accepted(new { challengeId = id, message = "Enviamos un código de verificación al nuevo correo. Vence en 10 minutos." });
        }

        [HttpPost("me/contact/email/confirm")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [EnableRateLimiting("client-otp-verify")]
        public async Task<IActionResult> ConfirmEmailChange([FromBody] ClientEmailChangeConfirm request, CancellationToken cancellationToken)
        {
            if (!TryGetPortalOwner(out var clientId, out var tenantId)) return Unauthorized();
            var email = request.Email?.Trim().ToLowerInvariant();
            var code = request.Code?.Trim() ?? "";
            if (request.ChallengeId == Guid.Empty || string.IsNullOrWhiteSpace(email) || code.Length != 6 || !code.All(char.IsDigit))
                return BadRequest(new { message = "Indica el correo, el código de 6 dígitos y el desafío." });
            var challenge = await _db.ClientContactOtpChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId && x.ClientId == clientId && x.TenantId == tenantId && x.Purpose == "profile-email" && x.ConsumedAt == null, cancellationToken);
            if (challenge is null || challenge.ExpiresAt <= DateTime.UtcNow || challenge.FailedAttempts >= 5)
                return BadRequest(new { message = "El código venció o ya no es válido. Solicita uno nuevo." });
            if (!FixedHashEquals(challenge.ValueHash, HashContactValue(email)) || !FixedHashEquals(challenge.CodeHash, HashContactCode(challenge.Id, tenantId, clientId, code)))
            {
                challenge.FailedAttempts++;
                await _db.SaveChangesAsync(cancellationToken);
                return BadRequest(new { message = "El correo o el código no coinciden." });
            }
            if (await _db.Clients.AnyAsync(x => x.TenantId == tenantId && x.Id != clientId && x.Email.ToLower() == email, cancellationToken))
                return Conflict(new { message = "Ese correo ya está asociado a otro cliente de esta financiera." });
            var client = await _db.Clients.SingleAsync(x => x.Id == clientId && x.TenantId == tenantId, cancellationToken);
            client.Email = email;
            challenge.ConsumedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { verified = true, email, message = "Correo actualizado y verificado." });
        }

        [HttpPost("me/profile-updates")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [RequestSizeLimit(20 * 1024 * 1024)]
        public async Task<IActionResult> SubmitProfileUpdate([FromBody] ClientProfileUpdatePayload request, CancellationToken cancellationToken)
        {
            if (!TryGetPortalOwner(out var clientId, out var tenantId)) return Unauthorized();
            var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId && x.TenantId == tenantId, cancellationToken);
            if (client is null) return NotFound();
            if (await _db.ClientProfileUpdateRequests.AnyAsync(x => x.ClientId == clientId && x.TenantId == tenantId && x.Status == "Pending", cancellationToken))
                return Conflict(new { message = "Ya tienes una actualización pendiente de revisión." });
            if (request.Address is null || string.IsNullOrWhiteSpace(request.Address.Direccion) || string.IsNullOrWhiteSpace(request.Address.Ciudad) || string.IsNullOrWhiteSpace(request.Address.Provincia))
                return BadRequest(new { message = "Completa la dirección, ciudad y provincia de tu domicilio." });
            if (request.References is { Count: > 5 } || request.References?.Any(x => string.IsNullOrWhiteSpace(x.Nombre) || string.IsNullOrWhiteSpace(x.Telefono)) == true)
                return BadRequest(new { message = "Revisa los datos de tus garantes; puedes incluir hasta cinco y cada uno necesita nombre y teléfono." });
            if (request.WorkInformation is { Salario: < 0 } || request.WorkInformation is { AntiguedadAnios: < 0 } ||
                (request.WorkInformation is not null && !Enum.IsDefined(request.WorkInformation.TipoEmpleo)) ||
                request.References?.Any(x => !Enum.IsDefined(x.Relacion)) == true)
                return BadRequest(new { message = "Hay datos de empleo o referencias que no son válidos." });
            if (request.BankAccount is not null && (string.IsNullOrWhiteSpace(request.BankAccount.Banco) || string.IsNullOrWhiteSpace(request.BankAccount.NumeroCuenta)))
                return BadRequest(new { message = "Completa el banco y el número de cuenta, o deja la cuenta sin cambios." });
            if (request.BankAccount is not null && !Enum.IsDefined(request.BankAccount.TipoCuenta))
                return BadRequest(new { message = "El tipo de cuenta bancaria seleccionado no es válido." });
            if (request.VideoDataUrl is { Length: > 18_000_000 }) return BadRequest(new { message = "El video excede el tamaño permitido." });

            string? newVideoPath = null;
            if (!string.IsNullOrWhiteSpace(request.VideoDataUrl))
            {
                var data = request.VideoDataUrl;
                var mime = "video/mp4";
                if (data.StartsWith("data:")) { var parts = data.Split(',', 2); mime = parts[0].Split(':')[1].Split(';')[0]; data = parts.Length > 1 ? parts[1] : ""; }
                if (mime is not ("video/mp4" or "video/webm")) return BadRequest(new { message = "Formato de video no permitido." });
                byte[] bytes;
                try { bytes = Convert.FromBase64String(data); } catch { return BadRequest(new { message = "El archivo de video no es válido." }); }
                if (bytes.Length > 12 * 1024 * 1024) return BadRequest(new { message = "El video excede 12 MB." });
                var uploadsDir = Environment.GetEnvironmentVariable("UPLOADS_PATH") ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "uploads"));
                Directory.CreateDirectory(uploadsDir);
                var extension = mime == "video/webm" ? ".webm" : ".mp4";
                newVideoPath = $"client-video-review-{clientId}-{Guid.NewGuid():N}{extension}";
                await System.IO.File.WriteAllBytesAsync(Path.Combine(uploadsDir, newVideoPath), bytes, cancellationToken);
            }

            var payload = request with { VideoDataUrl = null, VideoPath = newVideoPath };
            var update = new ClientProfileUpdateRequest { Id = Guid.NewGuid(), TenantId = tenantId, ClientId = clientId, PayloadJson = JsonSerializer.Serialize(payload), CreatedAt = DateTime.UtcNow };
            _db.ClientProfileUpdateRequests.Add(update);
            await _db.SaveChangesAsync(cancellationToken);
            return Accepted(new { update.Id, update.Status, update.CreatedAt, message = "Recibimos tus cambios. La financiera los revisará antes de actualizar tu perfil." });
        }

        [HttpGet("profile-updates/pending")]
        [Authorize(Policy = AuthorizationPolicies.ManageClients)]
        public async Task<IActionResult> GetPendingProfileUpdates(CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            var rows = await _db.ClientProfileUpdateRequests.AsNoTracking().Where(x => x.TenantId == tenantId && x.Status == "Pending")
                .OrderBy(x => x.CreatedAt).Take(100)
                .Join(_db.Clients.AsNoTracking(), x => x.ClientId, c => c.Id, (x, c) => new { x.Id, x.ClientId, clientName = c.Nombre, x.CreatedAt, x.PayloadJson })
                .ToListAsync(cancellationToken);
            return Ok(rows.Select(x => new { x.Id, x.ClientId, x.clientName, x.CreatedAt, payload = JsonSerializer.Deserialize<ClientProfileUpdatePayload>(x.PayloadJson) }));
        }

        [HttpPost("profile-updates/{id:guid}/review")]
        [Authorize(Policy = AuthorizationPolicies.ManageClients)]
        public async Task<IActionResult> ReviewProfileUpdate(Guid id, [FromBody] ReviewClientProfileUpdateRequest request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
            if (!request.Approve && string.IsNullOrWhiteSpace(request.Note)) return BadRequest(new { message = "Indica el motivo del rechazo para que el cliente pueda corregirlo." });
            var update = await _db.ClientProfileUpdateRequests.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && x.Status == "Pending", cancellationToken);
            if (update is null) return NotFound();
            var client = await _db.Clients.Include(x => x.Address).Include(x => x.WorkInformation).Include(x => x.BankAccount).Include(x => x.References).Include(x => x.VerificationMedia)
                .SingleOrDefaultAsync(x => x.Id == update.ClientId && x.TenantId == tenantId, cancellationToken);
            if (client is null) return NotFound();
            var reviewerClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            var reviewer = Guid.TryParse(reviewerClaim, out var userId) ? userId : (Guid?)null;
            if (request.Approve)
            {
                var payload = JsonSerializer.Deserialize<ClientProfileUpdatePayload>(update.PayloadJson);
                if (payload is null) return Conflict(new { message = "La solicitud no se puede leer; no se aplicaron cambios." });
                if (payload.Address is not null)
                {
                    client.Address ??= new Address { Id = Guid.NewGuid(), ClientId = client.Id };
                    client.Address.Direccion = payload.Address.Direccion.Trim(); client.Address.Ciudad = payload.Address.Ciudad.Trim(); client.Address.Provincia = payload.Address.Provincia.Trim(); client.Address.Sector = payload.Address.Sector?.Trim(); client.Address.CodigoPostal = payload.Address.CodigoPostal?.Trim();
                }
                if (payload.WorkInformation is not null)
                {
                    client.WorkInformation ??= new WorkInformation { Id = Guid.NewGuid(), ClientId = client.Id };
                    client.WorkInformation.Empresa = payload.WorkInformation.Empresa.Trim(); client.WorkInformation.Cargo = payload.WorkInformation.Cargo.Trim(); client.WorkInformation.Salario = payload.WorkInformation.Salario; client.WorkInformation.AntiguedadAnios = payload.WorkInformation.AntiguedadAnios; client.WorkInformation.DireccionEmpresa = payload.WorkInformation.DireccionEmpresa?.Trim(); client.WorkInformation.TelefonoEmpresa = payload.WorkInformation.TelefonoEmpresa?.Trim(); client.WorkInformation.TipoEmpleo = payload.WorkInformation.TipoEmpleo;
                }
                if (payload.References is not null)
                {
                    _db.References.RemoveRange(client.References);
                    foreach (var reference in payload.References) client.References.Add(new Reference { Id = Guid.NewGuid(), ClientId = client.Id, Nombre = reference.Nombre.Trim(), Telefono = reference.Telefono.Trim(), Email = reference.Email?.Trim(), Relacion = reference.Relacion });
                }
                if (payload.BankAccount is not null)
                {
                    client.BankAccount ??= new BankAccount { Id = Guid.NewGuid(), ClientId = client.Id };
                    client.BankAccount.Banco = payload.BankAccount.Banco.Trim(); client.BankAccount.NumeroCuenta = payload.BankAccount.NumeroCuenta.Trim(); client.BankAccount.TipoCuenta = payload.BankAccount.TipoCuenta;
                }
                if (payload.VideoPath is not null)
                {
                    client.VerificationMedia ??= new VerificationMedia { Id = Guid.NewGuid(), ClientId = client.Id };
                    client.VerificationMedia.VideoPath = payload.VideoPath;
                }
                client.ProfileReviewedAt = DateTime.UtcNow;
                update.Status = "Approved";
            }
            else update.Status = "Rejected";
            update.ReviewedAt = DateTime.UtcNow; update.ReviewedByUserId = reviewer; update.ReviewNote = request.Note?.Trim();
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { update.Id, update.Status, update.ReviewedAt, update.ReviewNote });
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

            if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Unauthorized();
            if (!await Security.ClientProfileAccess.IsCurrentAsync(_db, clientId, tenantId))
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "PROFILE_UPDATE_REQUIRED", message = "Actualiza tu perfil antes de consultar tus préstamos." });
            var allLoans = await _mediator.Send(new GetAllLoansQuery(TenantId: tenantId));
            var myLoans = allLoans.Where(l => l.ClientId == clientId).ToList();
            return Ok(myLoans);
        }

        [HttpGet("me/solicitudes")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId) ||
                !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Unauthorized();
            if (!await Security.ClientProfileAccess.IsCurrentAsync(_db, clientId, tenantId, cancellationToken))
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "PROFILE_UPDATE_REQUIRED", message = "Actualiza tu perfil antes de consultar solicitudes." });
            var applications = await _db.LoanApplications.AsNoTracking()
                .Include(x => x.VerificationMedia)
                .Where(x => x.ClientId == clientId && x.TenantId == tenantId)
                .OrderByDescending(x => x.FechaSolicitud)
                .Select(x => new { x.Id, x.MontoSolicitado, x.Moneda, x.Estado, x.FechaSolicitud, GarantiaPath = x.VerificationMedia == null ? null : x.VerificationMedia.GarantiaPath })
                .ToListAsync(cancellationToken);
            return Ok(applications);
        }

        [HttpPost("me/solicitudes")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> RequestAnotherLoan([FromBody] RepeatClientLoanRequest request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId) ||
                !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Unauthorized();
            if (request.MontoSolicitado <= 0 || request.MontoSolicitado != decimal.Round(request.MontoSolicitado, 2))
                return BadRequest(new { message = "Indica un monto válido con hasta dos decimales." });

            var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId && x.TenantId == tenantId, cancellationToken);
            if (client is null) return NotFound();
            if (!await Security.ClientProfileAccess.IsCurrentAsync(_db, clientId, tenantId, cancellationToken))
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "PROFILE_UPDATE_REQUIRED", message = "Actualiza tu perfil antes de solicitar otro préstamo." });

            var clientLoans = await _db.Loans.AsNoTracking()
                .Where(x => x.ClientId == clientId && x.TenantId == tenantId)
                .Select(x => new { x.Estado, x.SaldoPendiente })
                .ToListAsync(cancellationToken);
            if (!clientLoans.Any(x => x.Estado == EstadoPrestamo.Pagado) ||
                clientLoans.Any(x => x.Estado is not (EstadoPrestamo.Pagado or EstadoPrestamo.Cancelado)))
                return Conflict(new { message = "Podrás solicitar otro préstamo cuando tus préstamos actuales estén liquidados." });

            var hasOpenRequest = await _db.LoanApplications.AnyAsync(x =>
                x.ClientId == clientId && x.TenantId == tenantId &&
                (x.Estado == EstadoSolicitud.Pendiente || x.Estado == EstadoSolicitud.Procesando ||
                 x.Estado == EstadoSolicitud.Contraoferta || x.Estado == EstadoSolicitud.ClienteAprobada), cancellationToken);
            if (hasOpenRequest)
                return Conflict(new { message = "Ya tienes una solicitud en revisión. Consulta su estado antes de enviar otra." });

            var tenant = await _db.Tenants.AsNoTracking().SingleOrDefaultAsync(x => x.Id == tenantId && x.IsActive, cancellationToken);
            if (tenant is null) return NotFound();
            var moneda = CurrencyCatalog.Normalize(string.IsNullOrWhiteSpace(request.Moneda) ? tenant.MonedaPredeterminada : request.Moneda);
            var monedasHabilitadas = tenant.MonedasHabilitadas.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (!monedasHabilitadas.Contains(moneda, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new { message = "La moneda seleccionada no está habilitada por esta financiera." });

            var application = new LoanApplication
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = clientId,
                MontoSolicitado = request.MontoSolicitado,
                Moneda = moneda,
                // El cliente solicita el monto; la financiera establece y presenta los términos.
                Plazo = 0,
                UnidadPlazo = UnidadPlazo.Meses,
                FrecuenciaPago = FrecuenciaPago.Mensual,
                FrecuenciaInteres = FrecuenciaInteres.Mensual,
                Modalidad = ModalidadPrestamo.AmortizacionFrancesa,
                TipoPrestamo = TipoPrestamo.Personal,
                Estado = EstadoSolicitud.Pendiente,
                FechaSolicitud = DateTime.UtcNow
            };
            _db.LoanApplications.Add(application);
            await _db.SaveChangesAsync(cancellationToken);

            var email = SolicitudEmailBuilder.Build(application, client, EstadoSolicitud.Pendiente, clientPortalUrl: _notificationService.ClientPortalUrl);
            await _notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);

            return Created(string.Empty, new { application.Id, application.MontoSolicitado, application.Moneda, application.Estado, application.FechaSolicitud });
        }

        [HttpPost("me/solicitudes/{id:guid}/garantia")]
        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [RequestSizeLimit(8 * 1024 * 1024)]
        public async Task<IActionResult> UploadGuarantee(Guid id, [FromBody] GuaranteeUploadRequest request, CancellationToken cancellationToken)
        {
            if (!TryGetPortalOwner(out var clientId, out var tenantId)) return Unauthorized();
            if (!await Security.ClientProfileAccess.IsCurrentAsync(_db, clientId, tenantId, cancellationToken))
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "PROFILE_UPDATE_REQUIRED", message = "Actualiza tu perfil antes de cambiar documentos de una solicitud." });
            var application = await _db.LoanApplications.Include(x => x.VerificationMedia).FirstOrDefaultAsync(x => x.Id == id && x.ClientId == clientId && x.TenantId == tenantId, cancellationToken);
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
        public async Task<IActionResult> Register([FromBody] RegisterClientRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var email = request.Client?.Email?.Trim().ToLowerInvariant();
                var verified = !string.IsNullOrWhiteSpace(email) && await _db.EmailVerificationCodes.AnyAsync(
                    x => x.Email == email && x.Purpose == "client-registration" && x.VerifiedAt != null && x.VerifiedAt > DateTime.UtcNow.AddMinutes(-30), cancellationToken);
                if (!verified) return BadRequest(new { message = "Debes verificar el correo del cliente antes de continuar." });
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

        private bool TryGetPortalOwner(out Guid clientId, out Guid tenantId)
        {
            var hasClient = Guid.TryParse(User.FindFirst("clientId")?.Value, out clientId);
            var hasTenant = Guid.TryParse(User.FindFirst("tenantId")?.Value, out tenantId);
            return hasClient && hasTenant;
        }

        private string HashContactValue(string value) => Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(_otpOptions.OtpPepper), Encoding.UTF8.GetBytes($"profile-contact:{value}")));
        private string HashContactCode(Guid id, Guid tenantId, Guid clientId, string code) => Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(_otpOptions.OtpPepper), Encoding.UTF8.GetBytes($"profile-email-otp:{id:N}:{tenantId:N}:{clientId:N}:{code}")));
        private static bool FixedHashEquals(string expected, string actual)
        {
            try { return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(expected), Convert.FromHexString(actual)); }
            catch (FormatException) { return false; }
        }
    }

    public sealed record GuaranteeUploadRequest(string Image);
    public sealed record RepeatClientLoanRequest(decimal MontoSolicitado, string? Moneda = null);
    public sealed record ReviewClientProfileUpdateRequest(bool Approve, string? Note);
    public sealed record ClientProfileUpdatePayload(ProfileAddressUpdate? Address, ProfileWorkUpdate? WorkInformation,
        IReadOnlyList<ProfileReferenceUpdate>? References, ProfileBankAccountUpdate? BankAccount, string? VideoDataUrl, string? VideoPath = null);
    public sealed record ProfileAddressUpdate(string Direccion, string Ciudad, string Provincia, string? Sector, string? CodigoPostal);
    public sealed record ProfileWorkUpdate(string Empresa, string Cargo, decimal Salario, int AntiguedadAnios, string? DireccionEmpresa, string? TelefonoEmpresa, TipoEmpleo TipoEmpleo);
    public sealed record ProfileReferenceUpdate(string Nombre, RelacionReferencia Relacion, string Telefono, string? Email);
    public sealed record ProfileBankAccountUpdate(string Banco, TipoCuentaBancaria TipoCuenta, string NumeroCuenta);
    public sealed record ClientEmailChangeRequest(string Email);
    public sealed record ClientEmailChangeConfirm(Guid ChallengeId, string Email, string Code);
}
