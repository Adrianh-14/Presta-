using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Auth.Commands.Login;
using PréstamoPlus.Application.Features.Auth.Commands.RefreshToken;
using PréstamoPlus.Application.Features.Auth.Commands.Register;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IClientAuthenticationService _clientAuthentication;

        public AuthController(
            IMediator mediator,
            IClientAuthenticationService clientAuthentication)
        {
            _mediator = mediator;
            _clientAuthentication = clientAuthentication;
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
    public sealed record ClientOtpVerificationRequest(
        Guid ChallengeId,
        string Tenant,
        string Cedula,
        string Code);
}
