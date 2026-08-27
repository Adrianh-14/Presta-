using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
namespace PréstamoPlus.API.Controllers;
[ApiController, Route("api/tenant"), Authorize(Policy = AuthorizationPolicies.StaffRead)]
public sealed class TenantController : ControllerBase
{
    private readonly IEntitlementsService _service;
    public TenantController(IEntitlementsService service) => _service = service;
    [HttpGet("entitlements")]
    public async Task<IActionResult> Entitlements(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
        return Ok(await _service.GetAsync(tenantId, cancellationToken));
    }
}
