using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Controllers;

[ApiController]
[Route("api/location")]
public sealed class LocationController : ControllerBase
{
    private const string TermsVersion = "2026-09-01-v1";
    private const string TermsText = "El cliente autoriza compartir su ubicación únicamente durante una gestión de cobro activa, con el cobrador asignado al préstamo, por el tiempo indicado. Puede revocar esta autorización y la sesión expira automáticamente. No se habilita rastreo permanente ni se comparte la ubicación con terceros no autorizados.";
    private readonly ApplicationDbContext _db;

    public LocationController(ApplicationDbContext db) => _db = db;

    [HttpGet("terms")]
    [AllowAnonymous]
    public IActionResult Terms() => Ok(new { version = TermsVersion, text = TermsText, textHash = Hash(TermsText) });

    [HttpPost("consent")]
    [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
    public async Task<IActionResult> GrantConsent([FromBody] ConsentRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || !Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
        if (request.LoanId.HasValue && !await _db.Loans.AnyAsync(loan => loan.Id == request.LoanId && loan.TenantId == tenantId && loan.ClientId == clientId, cancellationToken)) return NotFound();
        var consent = new Domain.Entities.LocationConsentEvidence
        {
            Id = Guid.NewGuid(), TenantId = tenantId, ClientId = clientId, LoanId = request.LoanId,
            TermsVersion = TermsVersion, ConsentTextHash = Hash(TermsText),
            Purpose = "Coordinar una visita de cobro", Scope = "Ubicación temporal durante una sesión activa",
            GrantedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddDays(30),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(), UserAgent = Request.Headers.UserAgent.ToString(), DeviceId = request.DeviceId
        };
        _db.LocationConsentEvidence.Add(consent);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { consentId = consent.Id, version = TermsVersion, expiresAt = consent.ExpiresAt });
    }

    [HttpPost("consent/revoke")]
    [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
    public async Task<IActionResult> RevokeConsent(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
        var consents = await _db.LocationConsentEvidence.Where(item => item.ClientId == clientId && item.RevokedAt == null).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        foreach (var consent in consents) consent.RevokedAt = now;
        var sessions = await _db.LocationShareSessions.Where(item => item.ClientId == clientId && item.Status == "Active").ToListAsync(cancellationToken);
        foreach (var session in sessions) { session.Status = "Revoked"; session.EndedAt = now; }
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { revoked = consents.Count });
    }

    [HttpGet("my-session")]
    [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
    public async Task<IActionResult> GetMySession(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
        var session = await _db.LocationShareSessions.AsNoTracking().Where(item => item.ClientId == clientId && item.Status == "Active" && item.ExpiresAt > DateTime.UtcNow).OrderByDescending(item => item.StartedAt).FirstOrDefaultAsync(cancellationToken);
        return session is null ? NoContent() : Ok(new { sessionId = session.Id, expiresAt = session.ExpiresAt });
    }

    [HttpPost("sessions")]
    [Authorize(Policy = AuthorizationPolicies.ManageCollectors)]
    public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
        var assignment = await _db.CollectionAssignments.FirstOrDefaultAsync(item => item.Id == request.AssignmentId, cancellationToken);
        if (assignment is null) return NotFound(new { message = "Asignación no encontrada." });
        var loan = await _db.Loans.FirstOrDefaultAsync(item => item.Id == assignment.LoanId && item.TenantId == tenantId, cancellationToken);
        if (loan is null) return NotFound();
        var consent = await _db.LocationConsentEvidence.Where(item => item.TenantId == tenantId && item.ClientId == loan.ClientId && item.RevokedAt == null && item.ExpiresAt > DateTime.UtcNow).OrderByDescending(item => item.GrantedAt).FirstOrDefaultAsync(cancellationToken);
        if (consent is null) return Conflict(new { message = "El cliente no tiene un consentimiento de ubicación vigente." });
        var minutes = Math.Clamp(request.Minutes <= 0 ? 30 : request.Minutes, 5, 60);
        var session = new Domain.Entities.LocationShareSession { Id = Guid.NewGuid(), TenantId = tenantId, ClientId = loan.ClientId, LoanId = loan.Id, CollectorId = assignment.CollectorId, ConsentId = consent.Id, StartedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddMinutes(minutes) };
        _db.LocationShareSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { sessionId = session.Id, expiresAt = session.ExpiresAt });
    }

    [HttpPost("sessions/{id:guid}/position")]
    [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
    public async Task<IActionResult> UpdatePosition(Guid id, [FromBody] PositionRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
        if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180) return BadRequest(new { message = "Coordenadas inválidas." });
        var session = await _db.LocationShareSessions.FirstOrDefaultAsync(item => item.Id == id && item.ClientId == clientId && item.Status == "Active", cancellationToken);
        if (session is null || session.ExpiresAt <= DateTime.UtcNow) return StatusCode(StatusCodes.Status410Gone, new { message = "La sesión de ubicación expiró o fue revocada." });
        session.LastLatitude = request.Latitude; session.LastLongitude = request.Longitude; session.LastAccuracy = request.Accuracy; session.LastUpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("sessions/{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.CollectorPortal)]
    public async Task<IActionResult> GetSession(Guid id, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || !Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value, out var userId)) return Forbid();
        var collector = await _db.Collectors.FirstOrDefaultAsync(item => item.UserId == userId && item.TenantId == tenantId, cancellationToken);
        var session = collector is null ? null : await _db.LocationShareSessions.FirstOrDefaultAsync(item => item.Id == id && item.TenantId == tenantId && item.CollectorId == collector.Id && item.Status == "Active", cancellationToken);
        if (session is null || session.ExpiresAt <= DateTime.UtcNow) return NotFound();
        _db.LocationAccessAudits.Add(new Domain.Entities.LocationAccessAudit { Id = Guid.NewGuid(), TenantId = tenantId, SessionId = id, ViewerUserId = userId, Action = "Viewed" });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { sessionId = session.Id, latitude = session.LastLatitude, longitude = session.LastLongitude, accuracy = session.LastAccuracy, updatedAt = session.LastUpdatedAt, expiresAt = session.ExpiresAt });
    }

    [HttpGet("my-sessions")]
    [Authorize(Policy = AuthorizationPolicies.CollectorPortal)]
    public async Task<IActionResult> GetMySessions(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId) || !Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value, out var userId)) return Forbid();
        var collector = await _db.Collectors.AsNoTracking().FirstOrDefaultAsync(item => item.UserId == userId && item.TenantId == tenantId, cancellationToken);
        if (collector is null) return Forbid();
        var sessions = await _db.LocationShareSessions.AsNoTracking().Where(item => item.TenantId == tenantId && item.CollectorId == collector.Id && item.Status == "Active" && item.ExpiresAt > DateTime.UtcNow).Select(item => new { sessionId = item.Id, loanId = item.LoanId, latitude = item.LastLatitude, longitude = item.LastLongitude, accuracy = item.LastAccuracy, updatedAt = item.LastUpdatedAt, expiresAt = item.ExpiresAt }).ToListAsync(cancellationToken);
        return Ok(sessions);
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    public sealed record ConsentRequest(Guid? LoanId, string? DeviceId);
    public sealed record StartSessionRequest(Guid AssignmentId, int Minutes = 30);
    public sealed record PositionRequest(double Latitude, double Longitude, double? Accuracy);
}
