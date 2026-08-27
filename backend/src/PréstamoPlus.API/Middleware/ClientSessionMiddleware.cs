using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Middleware;

public sealed class ClientSessionMiddleware
{
    private readonly RequestDelegate _next;

    public ClientSessionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        ApplicationDbContext database,
        TimeProvider timeProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true && context.User.IsInRole("Cliente"))
        {
            var sessionId = Guid.Empty;
            var tenantId = Guid.Empty;
            var clientId = Guid.Empty;
            var validClaims =
                Guid.TryParse(context.User.FindFirst("sessionId")?.Value, out sessionId) &&
                Guid.TryParse(context.User.FindFirst("tenantId")?.Value, out tenantId) &&
                Guid.TryParse(context.User.FindFirst("clientId")?.Value, out clientId);

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var activeSession = validClaims && await database.ClientSessions
                .AsNoTracking()
                .AnyAsync(session =>
                    session.Id == sessionId &&
                    session.TenantId == tenantId &&
                    session.ClientId == clientId &&
                    session.RevokedAt == null &&
                    session.ExpiresAt > now,
                    context.RequestAborted);

            if (!activeSession)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.Headers.CacheControl = "no-store";
                await context.Response.WriteAsJsonAsync(
                    new { message = "Sesión de cliente inválida o expirada." },
                    context.RequestAborted);
                return;
            }
        }

        await _next(context);
    }
}
