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
    private const string TermsText = """
Términos de autorización para compartir ubicación durante una gestión de cobro

1. Finalidad. La ubicación se utilizará exclusivamente para coordinar una gestión de cobro relacionada con un préstamo del cliente. La autorización inicial podrá cubrir futuras sesiones de cobro mientras permanezca vigente, pero no convierte la ubicación en un mecanismo de vigilancia general ni permite consultar la posición fuera de una sesión activa.

2. Alcance. La ubicación podrá ser recibida únicamente durante una sesión temporal iniciada por la empresa para una asignación concreta, vinculada a un préstamo y a un cobrador identificado, en una jornada de cobro. La sesión tendrá una duración limitada, expirará automáticamente y no se mantendrá activa de forma permanente ni en segundo plano por defecto.

3. Personas autorizadas. La posición podrá ser consultada por personal de la empresa que tenga permisos operativos y por el cobrador asignado a la gestión correspondiente. No se compartirá con otros clientes, terceros no autorizados ni personas ajenas a la gestión.

4. Información visible. El cliente podrá consultar la finalidad, la versión de estos términos y el estado de su autorización. La aplicación puede solicitar adicionalmente el permiso técnico del sistema operativo. Aceptar estos términos no elimina ese permiso del dispositivo.

5. Vigencia y revocación. La autorización se registra una sola vez y permanece vigente hasta que el cliente la revoque o cambie materialmente el propósito, alcance, destinatarios o conservación. El cliente puede revocarla desde el portal. La revocación detiene las sesiones activas y evita iniciar nuevas sesiones con ese consentimiento. La revocación no elimina las obligaciones financieras ni los registros mínimos que deban conservarse para demostrar la autorización y su revocación.

6. Conservación y seguridad. Se conservará evidencia de la versión aceptada, el texto presentado, el momento de aceptación, vencimiento, revocación y los accesos realizados. Las coordenadas se conservarán solo durante el período operativo y de auditoría definido por la empresa, con controles de acceso y transmisión segura.

7. Exactitud y disponibilidad. La ubicación depende del dispositivo, señal, permisos y configuración del sistema operativo. Puede ser imprecisa, estar desactualizada o no estar disponible. La empresa no debe tomar la ubicación como única prueba de identidad, domicilio, deuda o incumplimiento.

8. Contacto y cambios. Cualquier cambio material en la finalidad, alcance, destinatarios o tiempo de conservación requerirá una nueva aceptación. La versión vigente y su huella digital se registrarán junto con cada autorización.
""";
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
        var existing = await _db.LocationConsentEvidence.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.ClientId == clientId && item.RevokedAt == null && (item.ExpiresAt == null || item.ExpiresAt > DateTime.UtcNow) && item.TermsVersion == TermsVersion)
            .OrderByDescending(item => item.GrantedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (existing is not null) return Ok(new { consentId = existing.Id, version = existing.TermsVersion, expiresAt = existing.ExpiresAt, alreadyRegistered = true });
        var consent = new Domain.Entities.LocationConsentEvidence
        {
            Id = Guid.NewGuid(), TenantId = tenantId, ClientId = clientId, LoanId = request.LoanId,
            TermsVersion = TermsVersion, ConsentTextHash = Hash(TermsText),
            Purpose = "Coordinar una visita de cobro", Scope = "Ubicación temporal durante una sesión activa",
            GrantedAt = DateTime.UtcNow, ExpiresAt = null,
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

    [HttpGet("consent/status")]
    [Authorize(Policy = AuthorizationPolicies.ClientPortal)]
    public async Task<IActionResult> ConsentStatus(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("clientId")?.Value, out var clientId)) return Unauthorized();
        var consent = await _db.LocationConsentEvidence.AsNoTracking().Where(item => item.ClientId == clientId && item.RevokedAt == null && (item.ExpiresAt == null || item.ExpiresAt > DateTime.UtcNow)).OrderByDescending(item => item.GrantedAt).FirstOrDefaultAsync(cancellationToken);
        return Ok(new { active = consent is not null, consentId = consent?.Id, version = consent?.TermsVersion, expiresAt = consent?.ExpiresAt });
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
        var consent = await _db.LocationConsentEvidence.Where(item => item.TenantId == tenantId && item.ClientId == loan.ClientId && item.RevokedAt == null && (item.ExpiresAt == null || item.ExpiresAt > DateTime.UtcNow)).OrderByDescending(item => item.GrantedAt).FirstOrDefaultAsync(cancellationToken);
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
