using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
namespace PréstamoPlus.API.Controllers;
[ApiController, Route("api/webhooks")]
public sealed class WebhooksController : ControllerBase
{
    private readonly IWebhookService _service; public WebhooksController(IWebhookService service)=>_service=service;
    [HttpPost("{provider}")]
    public async Task<IActionResult> Receive(string provider, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(Request.Headers["X-Tenant-Id"], out var tenantId) || !Request.Headers.TryGetValue("X-Webhook-Id", out var eventId) || !Request.Headers.TryGetValue("X-Webhook-Signature", out var signature)) return BadRequest();
        using var reader = new StreamReader(Request.Body); var payload = await reader.ReadToEndAsync(cancellationToken);
        return await _service.AcceptAsync(tenantId, provider, eventId.ToString(), signature.ToString(), payload, cancellationToken) ? Accepted() : Unauthorized();
    }
}
