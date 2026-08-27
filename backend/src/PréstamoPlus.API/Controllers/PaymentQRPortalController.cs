using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.PaymentQR.Commands.ProcessPaymentQR;
using PréstamoPlus.Application.Features.PaymentQR.Queries.GetPaymentQRStatus;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Controllers
{
    [ApiController]
    [Route("api/portal/pago-qr")]
    public class PaymentQRPortalController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IClientAuthenticationService _clientAuth;
        private readonly ApplicationDbContext _dbContext;

        public PaymentQRPortalController(
            IMediator mediator,
            IClientAuthenticationService clientAuth,
            ApplicationDbContext dbContext)
        {
            _mediator = mediator;
            _clientAuth = clientAuth;
            _dbContext = dbContext;
        }

        private async Task<string> GetTenantSlugAsync(Guid tenantId, CancellationToken cancellationToken)
        {
            return await _dbContext.Tenants
                .AsNoTracking()
                .Where(tenant => tenant.Id == tenantId && tenant.IsActive)
                .Select(tenant => tenant.Slug)
                .SingleOrDefaultAsync(cancellationToken) ?? string.Empty;
        }

        [HttpGet("{token}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(QRPaymentInfoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetQRInfo(string token)
        {
            var result = await _mediator.Send(new GetPaymentQRStatusQuery(token));
            if (result is null) return NotFound(new { message = "QR no encontrado." });
            return Ok(result);
        }

        [HttpPost("request-otp")]
        [AllowAnonymous]
        [EnableRateLimiting("client-otp-request")]
        [ProducesResponseType(StatusCodes.Status202Accepted)]
        public async Task<IActionResult> RequestOtp(
            [FromBody] QRRequestOtpRequest request,
            CancellationToken cancellationToken)
        {
            var paymentQR = await _dbContext.PaymentQRs
                .AsNoTracking()
                .Include(qr => qr.Client)
                .SingleOrDefaultAsync(qr => qr.Token == request.Token, cancellationToken);

            var isAvailable = paymentQR is not null &&
                paymentQR.Status == PaymentQRStatus.Pending &&
                paymentQR.ExpiresAt > DateTime.UtcNow;
            var identifierMatches = isAvailable && string.Equals(
                NormalizeIdentifier(paymentQR!.Client.Cedula),
                NormalizeIdentifier(request.Cedula),
                StringComparison.Ordinal);
            var tenantSlug = identifierMatches
                ? await GetTenantSlugAsync(paymentQR!.Client.TenantId, cancellationToken)
                : "invalid-qr-tenant";

            Response.Headers.CacheControl = "no-store";
            var result = await _clientAuth.RequestOtpAsync(
                tenantSlug,
                request.Cedula,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);

            return Accepted(new
            {
                challengeId = result.ChallengeId,
                message = result.Message,
                expiresInSeconds = result.ExpiresInSeconds
            });
        }

        [HttpPost("verify-otp")]
        [AllowAnonymous]
        [EnableRateLimiting("client-otp-verify")]
        [ProducesResponseType(typeof(PaymentQRProcessResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> VerifyOtpAndPay(
            [FromBody] QRVerifyOtpRequest request,
            CancellationToken cancellationToken)
        {
            var paymentQR = await _dbContext.PaymentQRs
                .AsNoTracking()
                .Include(qr => qr.Client)
                .SingleOrDefaultAsync(qr => qr.Token == request.Token, cancellationToken);
            var isAvailable = paymentQR is not null &&
                paymentQR.Status == PaymentQRStatus.Pending &&
                paymentQR.ExpiresAt > DateTime.UtcNow;
            var identifierMatches = isAvailable && string.Equals(
                NormalizeIdentifier(paymentQR!.Client.Cedula),
                NormalizeIdentifier(request.Cedula),
                StringComparison.Ordinal);
            var tenantSlug = identifierMatches
                ? await GetTenantSlugAsync(paymentQR!.Client.TenantId, cancellationToken)
                : "invalid-qr-tenant";

            var authResult = await _clientAuth.VerifyOtpAsync(
                request.ChallengeId,
                tenantSlug,
                request.Cedula,
                request.Code,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);

            if (authResult is null || !identifierMatches)
                return Unauthorized(new { message = "Código OTP inválido o expirado." });

            var payResult = await _mediator.Send(new ProcessPaymentQRCommand(
                new ProcessPaymentQRRequest
                {
                    Token = request.Token,
                    Latitud = request.Latitud,
                    Longitud = request.Longitud
                }), cancellationToken);

            if (!payResult.Success)
                return BadRequest(payResult);

            return Ok(payResult);
        }

        private static string NormalizeIdentifier(string? value) => new(
            (value ?? string.Empty)
                .Where(char.IsLetterOrDigit)
                .Select(char.ToUpperInvariant)
                .ToArray());
    }
}
