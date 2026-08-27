using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
namespace PréstamoPlus.API.Controllers;
[ApiController, Route("api/anomalies"), Authorize(Policy = AuthorizationPolicies.StaffRead)]
public sealed class AnomaliesController : ControllerBase
{
    private readonly IAnomalyDetectionService _service;
    public AnomaliesController(IAnomalyDetectionService service) => _service = service;
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
        return Ok(await _service.ScanAsync(tenantId, cancellationToken));
    }
}
