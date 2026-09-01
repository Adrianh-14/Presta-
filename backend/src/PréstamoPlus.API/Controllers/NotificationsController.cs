using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize(Policy = AuthorizationPolicies.StaffRead)]
public sealed class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public NotificationsController(ApplicationDbContext db) => _db = db;

    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) { Response.StatusCode = StatusCodes.Status403Forbidden; return; }
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        var lastCount = -1;
        while (!cancellationToken.IsCancellationRequested)
        {
            var count = await _db.LoanApplications.AsNoTracking().CountAsync(item => item.TenantId == tenantId && item.Estado == Domain.Enums.EstadoSolicitud.Pendiente, cancellationToken);
            if (count != lastCount)
            {
                await Response.WriteAsync($"event: solicitudes\ndata: {JsonSerializer.Serialize(new { pendientes = count })}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
                lastCount = count;
            }
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        }
    }
}
