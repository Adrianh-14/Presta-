using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
namespace PréstamoPlus.API.Controllers;
[ApiController, Route("api/tenant/config"), Authorize(Policy = AuthorizationPolicies.ManageUsers)]
public sealed class TenantConfigurationController : ControllerBase
{
    private readonly ITenantConfigurationService _service; public TenantConfigurationController(ITenantConfigurationService service)=>_service=service;
    [HttpGet] public async Task<IActionResult> Get(CancellationToken ct) => await _service.GetAsync(TenantId(),ct) is { } result ? Ok(result) : NotFound();
    [HttpPut] public async Task<IActionResult> Put(UpdateTenantBrandingRequest request, CancellationToken ct) => await _service.UpdateAsync(TenantId(),request,ct) is { } result ? Ok(result) : NotFound();
    private Guid TenantId() => Guid.TryParse(User.FindFirst("tenantId")?.Value,out var id) ? id : Guid.Empty;
}
