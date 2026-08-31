using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace PréstamoPlus.API.Controllers;
[ApiController, Route("api/tenant"), Authorize(Policy = AuthorizationPolicies.StaffRead)]
public sealed class TenantController : ControllerBase
{
    private readonly IEntitlementsService _service;
    private readonly ApplicationDbContext _db;
    public TenantController(IEntitlementsService service, ApplicationDbContext db) { _service = service; _db = db; }
    [HttpGet("entitlements")]
    public async Task<IActionResult> Entitlements(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();
        return Ok(await _service.GetAsync(tenantId, cancellationToken));
    }

    // Datos mínimos necesarios para que el formulario público solo ofrezca
    // las divisas habilitadas por la empresa del enlace.
    [AllowAnonymous]
    [HttpGet("public/{id:guid}/currencies")]
    public async Task<IActionResult> PublicCurrencies(Guid id, CancellationToken cancellationToken)
    {
        var currencies = await _db.Tenants.AsNoTracking().Where(t => t.Id == id && t.IsActive)
            .Select(t => t.MonedasHabilitadas).SingleOrDefaultAsync(cancellationToken);
        if (currencies is null) return NotFound();
        var result = currencies.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => x.ToUpperInvariant()).Distinct().ToList();
        return Ok(new { monedasHabilitadas = result.Count > 0 ? result : new List<string> { "DOP" } });
    }
}
