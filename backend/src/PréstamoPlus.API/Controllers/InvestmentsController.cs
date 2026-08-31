using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.API.Controllers;

[ApiController, Route("api/inversiones"), Authorize]
public sealed class InvestmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IJournalService _journal;
    public InvestmentsController(ApplicationDbContext db, IJournalService journal) { _db = db; _journal = journal; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InvestmentRequest request, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Unauthorized();
        if (request.Amount <= 0 || string.IsNullOrWhiteSpace(request.Currency)) return BadRequest(new { message = "El monto y la divisa son obligatorios." });
        var code = request.Currency.Trim().ToUpperInvariant();
        var tenant = await _db.Tenants.FirstOrDefaultAsync(x => x.Id == tenantId, ct);
        if (tenant is null) return NotFound();
        var balances = JsonSerializer.Deserialize<Dictionary<string, decimal>>(tenant.CapitalInicialPorMonedaJson ?? "{}") ?? new();
        balances[code] = balances.GetValueOrDefault(code) + request.Amount;
        tenant.CapitalInicialPorMonedaJson = JsonSerializer.Serialize(balances);
        var config = await _db.TenantConfigs.FirstOrDefaultAsync(x => x.TenantId == tenantId, ct);
        if (code == "DOP") tenant.CapitalInicial += request.Amount;
        if (code == "USD") tenant.CapitalInicialUsd += request.Amount;
        if (code == "EUR") tenant.CapitalInicialEur += request.Amount;
        if (config is not null)
        {
            if (code == "DOP") config.CapitalInicial += request.Amount;
            if (code == "USD") config.CapitalInicialUsd += request.Amount;
            if (code == "EUR") config.CapitalInicialEur += request.Amount;
        }
        await _db.SaveChangesAsync(ct);
        await _journal.PostAsync(tenantId, "investment", Guid.NewGuid(), new[]
        {
            new JournalLineInput("CASH", request.Amount, 0, "Inyección de capital", code),
            new JournalLineInput("OWNER_EQUITY", 0, request.Amount, "Aporte de inversión", code)
        }, ct);
        return Ok(new { currency = code, amount = request.Amount, capitalDisponible = balances[code] });
    }

    public sealed record InvestmentRequest(decimal Amount, string Currency, decimal Rate = 0, string? Note = null);
}
