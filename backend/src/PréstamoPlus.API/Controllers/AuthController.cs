using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Auth.Commands.Login;
using PréstamoPlus.Application.Features.Auth.Commands.RefreshToken;
using PréstamoPlus.Application.Features.Auth.Commands.Register;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IClientAuthenticationService _clientAuthentication;
        private readonly ITenantRegistrationService _tenantRegistration;
        private readonly ApplicationDbContext _db;
        private readonly IPasswordService _passwords;
        private readonly INotificationService _notifications;

        public AuthController(
            IMediator mediator,
            IClientAuthenticationService clientAuthentication,
            ITenantRegistrationService tenantRegistration,
            ApplicationDbContext db,
            IPasswordService passwords,
            INotificationService notifications)
        {
            _mediator = mediator;
            _clientAuthentication = clientAuthentication;
            _tenantRegistration = tenantRegistration;
            _db = db;
            _passwords = passwords;
            _notifications = notifications;
        }

        [HttpPost("tenant-register")]
        [AllowAnonymous]
        [EnableRateLimiting("tenant-registration")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterTenant(
            [FromBody] TenantRegistrationRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var result = await _tenantRegistration.RegisterAsync(request, cancellationToken);
                return Created(string.Empty, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _mediator.Send(new LoginCommand(request));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("password-reset/request")]
        [AllowAnonymous]
        [EnableRateLimiting("tenant-registration")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequest request, CancellationToken cancellationToken)
        {
            var response = new { message = "Si el correo existe, recibirás instrucciones para recuperar tu contraseña." };
            var email = request.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email)) return Ok(response);
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email && x.IsActive, cancellationToken);
            if (user is null) return Ok(response);
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
            _db.PasswordResetTokens.Add(new PasswordResetToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = tokenHash, ExpiresAt = DateTime.UtcNow.AddMinutes(30) });
            await _db.SaveChangesAsync(cancellationToken);
            var resetUrl = $"{_notifications.ClientPortalUrl.Replace("/portal/login", "/recuperar-contrasena")}?token={rawToken}";
            await _notifications.SendEmailAsync(user.Email, "Recupera tu contraseña de PréstamoPlus", $"<p>Solicitaste recuperar tu contraseña.</p><p><a href=\"{resetUrl}\">Crear una nueva contraseña</a></p><p>Este enlace vence en 30 minutos.</p>");
            return Ok(response);
        }

        [HttpPost("password-reset/confirm")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmPasswordReset([FromBody] PasswordResetConfirmRequest request, CancellationToken cancellationToken)
        {
            if (request.NewPassword.Length < 12 || !request.NewPassword.Any(char.IsUpper) || !request.NewPassword.Any(char.IsLower) || !request.NewPassword.Any(char.IsDigit) || !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
                return BadRequest(new { message = "La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo." });
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token))).ToLowerInvariant();
            var reset = await _db.PasswordResetTokens.Include(x => x.User).FirstOrDefaultAsync(x => x.TokenHash == hash && x.UsedAt == null && x.ExpiresAt > DateTime.UtcNow, cancellationToken);
            if (reset is null) return BadRequest(new { message = "El enlace es inválido o expiró." });
            reset.User.PasswordHash = _passwords.Hash(request.NewPassword);
            reset.UsedAt = DateTime.UtcNow;
            var sessions = _db.RefreshTokens.Where(x => x.UserId == reset.UserId && x.RevokedAt == null);
            await sessions.ForEachAsync(x => x.RevokedAt = DateTime.UtcNow, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Contraseña actualizada. Ya puedes iniciar sesión." });
        }

        [HttpPost("register")]
        [Authorize(Policy = AuthorizationPolicies.ManageUsers)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId))
                {
                    return Forbid();
                }

                var result = await _mediator.Send(new RegisterCommand(request, tenantId));
                return Created(string.Empty, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var result = await _mediator.Send(new RefreshTokenCommand(request));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("client-otp/request")]
        [AllowAnonymous]
        [EnableRateLimiting("client-otp-request")]
        [ProducesResponseType(typeof(ClientOtpRequestResult), StatusCodes.Status202Accepted)]
        public async Task<IActionResult> RequestClientOtp(
            [FromBody] ClientOtpRequest request,
            CancellationToken cancellationToken)
        {
            Response.Headers.CacheControl = "no-store";
            var result = await _clientAuthentication.RequestOtpAsync(
                request.Tenant,
                request.Cedula,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);
            return Accepted(result);
        }

        [HttpPost("client-otp/tenants")]
        [AllowAnonymous]
        [EnableRateLimiting("client-otp-request")]
        public async Task<IActionResult> FindClientTenants(
            [FromBody] ClientTenantLookupRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _clientAuthentication.FindClientTenantsAsync(request.Cedula, cancellationToken);
            return Ok(result);
        }

        [HttpPost("client-otp/verify")]
        [AllowAnonymous]
        [EnableRateLimiting("client-otp-verify")]
        [ProducesResponseType(typeof(ClientAuthenticationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> VerifyClientOtp(
            [FromBody] ClientOtpVerificationRequest request,
            CancellationToken cancellationToken)
        {
            Response.Headers.CacheControl = "no-store";
            var result = await _clientAuthentication.VerifyOtpAsync(
                request.ChallengeId,
                request.Tenant,
                request.Cedula,
                request.Code,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);

            if (result is null)
            {
                return Unauthorized(new { message = "Código inválido o expirado." });
            }

            return Ok(result);
        }

        [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
        [HttpPost("client-session/revoke")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RevokeClientSession(CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirst("sessionId")?.Value, out var sessionId) ||
                !Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) ||
                !Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId))
            {
                return Unauthorized();
            }

            await _clientAuthentication.RevokeSessionAsync(
                sessionId,
                tenantId,
                clientId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);
            return NoContent();
        }
    }

    public sealed record ClientOtpRequest(string Tenant, string Cedula);
    public sealed record ClientTenantLookupRequest(string Cedula);
    public sealed record ClientOtpVerificationRequest(
        Guid ChallengeId,
        string Tenant,
        string Cedula,
        string Code);
}
