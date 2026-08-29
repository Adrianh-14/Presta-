using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;
using System.Security.Claims;
using PréstamoPlus.Domain.Entities.Tenancy;

namespace PréstamoPlus.API.Controllers;

[ApiController, Route("api/platform"), Authorize]
public sealed class PlatformController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public PlatformController(ApplicationDbContext db) => _db = db;

    private bool IsPlatformAdmin() => new[] { "SuperAdmin", "PlatformAdmin", "AdministradorPlataforma" }
        .Contains(User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value, StringComparer.OrdinalIgnoreCase);

    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var now = DateTime.UtcNow;
        var tenants = await _db.Tenants.AsNoTracking().Include(x => x.Subscription).ToListAsync(ct);
        return Ok(new {
            totalEmpresas = tenants.Count,
            empresasActivas = tenants.Count(x => x.IsActive),
            enPrueba = tenants.Count(x => x.Subscription?.Status == Domain.Entities.Tenancy.SubscriptionStatus.Trialing),
            vencidas = tenants.Count(x => x.Subscription is null || (x.Subscription.Status == Domain.Entities.Tenancy.SubscriptionStatus.Active && x.Subscription.CurrentPeriodEnd <= now)),
            empresas = tenants.OrderByDescending(x => x.CreatedAt).Select(x => new { x.Id, x.Nombre, x.Slug, x.IsActive, x.CreatedAt, planId = x.Subscription?.PlanId ?? "basic", precioPersonalizado = x.Subscription?.CustomPrice, estado = x.Subscription?.Status.ToString() ?? "Sin suscripción", periodoHasta = x.Subscription?.CurrentPeriodEnd })
        });
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> Tenants(CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var tenants = await _db.Tenants.AsNoTracking().Include(x => x.Subscription).OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        var configs = await _db.TenantConfigs.AsNoTracking().Where(x => tenants.Select(t => t.Id).Contains(x.TenantId)).ToDictionaryAsync(x => x.TenantId, ct);
        return Ok(tenants.Select(x => new { x.Id, x.Nombre, x.Slug, x.Email, x.IsActive, x.CreatedAt, diasGracia = configs.TryGetValue(x.Id, out var cfg) ? cfg.DiasGracia : 3, planId = x.Subscription?.PlanId ?? "basic", precioPersonalizado = x.Subscription?.CustomPrice, gratis = x.Subscription?.IsComplimentary ?? false, gratisHasta = x.Subscription?.ComplimentaryUntil, estado = x.Subscription?.Status.ToString() ?? "Sin suscripción", periodoHasta = x.Subscription?.CurrentPeriodEnd }));
    }

    [HttpPut("tenants/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] StatusRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var tenant = await _db.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant is null) return NotFound();
        tenant.IsActive = request.IsActive; tenant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { tenant.Id, tenant.IsActive });
    }

    [HttpPost("tenants/bulk")]
    public async Task<IActionResult> BulkTenants([FromBody] BulkTenantRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        if (request.TenantIds is null || request.TenantIds.Count == 0) return BadRequest("Selecciona al menos una empresa.");
        var tenants = await _db.Tenants.Where(x => request.TenantIds.Contains(x.Id)).ToListAsync(ct);
        foreach (var tenant in tenants) { if (request.IsActive.HasValue) tenant.IsActive = request.IsActive.Value; tenant.UpdatedAt = DateTime.UtcNow; }
        if (request.Gratis.HasValue || request.PrecioPersonalizado.HasValue || request.GratisHasta.HasValue || request.PlanId is not null)
        {
            var subs = await _db.Subscriptions.Where(x => request.TenantIds.Contains(x.TenantId)).ToListAsync(ct);
            foreach (var tenantId in request.TenantIds.Except(subs.Select(x=>x.TenantId))) { var sub = new Subscription { Id=Guid.NewGuid(), TenantId=tenantId, CurrentPeriodStart=DateTime.UtcNow, CurrentPeriodEnd=DateTime.UtcNow.AddMonths(1) }; _db.Subscriptions.Add(sub); subs.Add(sub); }
            foreach (var sub in subs.Where(x=>request.TenantIds.Contains(x.TenantId))) { if(request.PlanId is not null) sub.PlanId=request.PlanId; if(request.PrecioPersonalizado.HasValue) sub.CustomPrice=request.PrecioPersonalizado; if(request.Gratis.HasValue) sub.IsComplimentary=request.Gratis.Value; if(request.GratisHasta.HasValue || request.Gratis==false) sub.ComplimentaryUntil=request.GratisHasta; }
        }
        await _db.SaveChangesAsync(ct); return Ok(new { actualizadas = tenants.Count });
    }

    [HttpPut("tenants/{id:guid}/subscription")]
    public async Task<IActionResult> UpdateSubscription(Guid id, [FromBody] SubscriptionRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var tenant = await _db.Tenants.Include(x => x.Subscription).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (tenant is null) return NotFound();
        var sub = tenant.Subscription ?? new Subscription { Id = Guid.NewGuid(), TenantId = id, CurrentPeriodStart = DateTime.UtcNow };
        sub.PlanId = string.IsNullOrWhiteSpace(request.PlanId) ? "basic" : request.PlanId.Trim().ToLowerInvariant();
        sub.CustomPrice = request.PrecioPersonalizado;
        sub.IsComplimentary = request.Gratis;
        sub.ComplimentaryUntil = request.Gratis ? request.GratisHasta : null;
        sub.ComplimentaryNote = request.NotaGratis;
        if (Enum.TryParse<SubscriptionStatus>(request.Status, true, out var status)) sub.Status = status;
        sub.CurrentPeriodEnd = request.PeriodoHasta ?? DateTime.UtcNow.AddMonths(1);
        sub.TrialEndsAt = request.TrialEndsAt;
        if (tenant.Subscription is null) _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync(ct);
        return Ok(new { sub.PlanId, precioPersonalizado = sub.CustomPrice, estado = sub.Status.ToString(), sub.CurrentPeriodEnd, sub.TrialEndsAt });
    }

    [HttpGet("plans")]
    public async Task<IActionResult> Plans(CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        if (!await _db.PlatformPlans.AnyAsync(ct)) { _db.PlatformPlans.AddRange(new PlatformPlan { Id=Guid.NewGuid(), Code="basic", Nombre="Básico", PrecioMensual=10, Descripcion="Operación esencial para comenzar" }, new PlatformPlan { Id=Guid.NewGuid(), Code="pro", Nombre="Profesional", PrecioMensual=29, Descripcion="Más automatización y control" }, new PlatformPlan { Id=Guid.NewGuid(), Code="enterprise", Nombre="Enterprise", PrecioMensual=79, Descripcion="Escala multiempresa y soporte prioritario" }); await _db.SaveChangesAsync(ct); }
        return Ok(await _db.PlatformPlans.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.PrecioMensual).Select(x=>new { id=x.Code, nombre=x.Nombre, precio=x.PrecioMensual, descripcion=x.Descripcion }).ToListAsync(ct));
    }

    [HttpPut("plans/{code}")]
    public async Task<IActionResult> UpdatePlan(string code, [FromBody] PlanRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        if (request.Precio < 0 || request.Precio > 100000) return BadRequest("Precio inválido.");
        var plan = await _db.PlatformPlans.FirstOrDefaultAsync(x=>x.Code==code, ct);
        if (plan is null) return NotFound();
        plan.PrecioMensual=request.Precio; if (!string.IsNullOrWhiteSpace(request.Nombre)) plan.Nombre=request.Nombre.Trim(); if (request.Descripcion is not null) plan.Descripcion=request.Descripcion.Trim(); plan.UpdatedAt=DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(new { id=plan.Code, nombre=plan.Nombre, precio=plan.PrecioMensual, descripcion=plan.Descripcion });
    }

    [HttpPut("tenants/{id:guid}/grace")]
    public async Task<IActionResult> UpdateGrace(Guid id, [FromBody] GraceRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        if (request.DiasGracia is < 0 or > 90) return BadRequest("Los días de gracia deben estar entre 0 y 90.");
        var config = await _db.TenantConfigs.FirstOrDefaultAsync(x => x.TenantId == id, ct);
        if (config is null) { config = new TenantConfig { Id = Guid.NewGuid(), TenantId = id }; _db.TenantConfigs.Add(config); }
        config.DiasGracia = request.DiasGracia;
        await _db.SaveChangesAsync(ct);
        return Ok(new { config.TenantId, config.DiasGracia });
    }

    [HttpGet("tenants/{id:guid}/users")]
    public async Task<IActionResult> Users(Guid id, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        return Ok(await _db.Users.AsNoTracking().Where(x=>x.TenantId==id).Select(x=>new {x.Id,x.Nombre,x.Email,x.Role,x.IsActive,x.CreatedAt,x.LastLoginAt}).ToListAsync(ct));
    }

    [HttpPut("users/{id:guid}/status")]
    public async Task<IActionResult> UserStatus(Guid id, [FromBody] StatusRequest request, CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var user = await _db.Users.FirstOrDefaultAsync(x=>x.Id==id, ct); if (user is null) return NotFound();
        user.IsActive=request.IsActive; await _db.SaveChangesAsync(ct); return Ok(new {user.Id,user.IsActive});
    }

    [HttpGet("audit")]
    public async Task<IActionResult> Audit(CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var rows = await _db.AuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct);
        return Ok(rows.Select(x => new { x.Id, x.TenantId, x.Action, x.EntityType, x.EntityId, x.CreatedAt }));
    }

    [HttpGet("financials")]
    public async Task<IActionResult> Financials(CancellationToken ct)
    {
        if (!IsPlatformAdmin()) return Forbid();
        var tenants = await _db.Tenants.AsNoTracking().Include(x=>x.Subscription).ToListAsync(ct);
        var plans = await _db.PlatformPlans.AsNoTracking().ToDictionaryAsync(x=>x.Code, ct);
        decimal expected=0; var free=0; var overdue=0; var active=0;
        foreach(var t in tenants){var s=t.Subscription; if(s?.IsComplimentary==true && s.ComplimentaryUntil>DateTime.UtcNow){free++;continue;} var price=s?.CustomPrice ?? (s is not null && plans.TryGetValue(s.PlanId,out var p)?p.PrecioMensual:0); expected+=price; if(s?.Status==SubscriptionStatus.PastDue || (s?.CurrentPeriodEnd<DateTime.UtcNow && s?.Status==SubscriptionStatus.Active)) overdue++; if(s?.Status==SubscriptionStatus.Active || s?.Status==SubscriptionStatus.Trialing) active++;}
        return Ok(new {ingresoMensualEsperado=expected, suscripcionesActivas=active, cortesiasActivas=free, cuentasVencidas=overdue, totalEmpresas=tenants.Count, tasaPagoPuntual=tenants.Count==0?100:Math.Round((double)(tenants.Count-overdue)*100/tenants.Count,1)});
    }

    [HttpGet("promotion")]
    public async Task<IActionResult> Promotion(CancellationToken ct){ if(!IsPlatformAdmin()) return Forbid(); return Ok(await _db.PlatformPromotions.AsNoTracking().OrderByDescending(x=>x.UpdatedAt).FirstOrDefaultAsync(ct)); }

    [HttpPut("promotion")]
    public async Task<IActionResult> UpdatePromotion([FromBody] PromotionRequest request, CancellationToken ct){
        if(!IsPlatformAdmin()) return Forbid(); if(request.EndsAt<=request.StartsAt) return BadRequest("La fecha final debe ser posterior a la inicial.");
        var p=await _db.PlatformPromotions.OrderByDescending(x=>x.UpdatedAt).FirstOrDefaultAsync(ct); var isNew=p is null; p ??= new PlatformPromotion{Id=Guid.NewGuid()}; p.IsActive=request.IsActive;p.AppliesToNewTenants=request.AppliesToNewTenants;p.StartsAt=request.StartsAt;p.EndsAt=request.EndsAt;p.Label=string.IsNullOrWhiteSpace(request.Label)?"Cortesía de plataforma":request.Label.Trim();p.UpdatedAt=DateTime.UtcNow;if(isNew)_db.PlatformPromotions.Add(p); await _db.SaveChangesAsync(ct); return Ok(p);
    }

    public sealed record StatusRequest(bool IsActive);
    public sealed record BulkTenantRequest(List<Guid> TenantIds, bool? IsActive = null, string? PlanId = null, decimal? PrecioPersonalizado = null, bool? Gratis = null, DateTime? GratisHasta = null);
    public sealed record GraceRequest(int DiasGracia);
    public sealed record PlanRequest(decimal Precio, string? Nombre, string? Descripcion);
    public sealed record PromotionRequest(bool IsActive, bool AppliesToNewTenants, DateTime StartsAt, DateTime EndsAt, string? Label);
    public sealed record SubscriptionRequest(string? PlanId, string? Status, DateTime? PeriodoHasta, DateTime? TrialEndsAt, decimal? PrecioPersonalizado, bool Gratis = false, DateTime? GratisHasta = null, string? NotaGratis = null);
}
