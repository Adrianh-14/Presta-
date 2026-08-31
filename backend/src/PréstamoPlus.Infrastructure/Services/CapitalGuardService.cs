using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Domain;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class CapitalGuardService : ICapitalGuardService
{
    private readonly ApplicationDbContext _context;
    public CapitalGuardService(ApplicationDbContext context) => _context = context;
    public async Task<decimal> GetAvailableAsync(Guid tenantId, string currency = "DOP", CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty) return 0;
        var code = CurrencyCatalog.Normalize(currency);
        // El mapa del tenant ya contiene las inversiones registradas. Los asientos
        // de inversión no se vuelven a sumar; aquí solo aplicamos desembolsos y cobros.
        var cashLines = _context.JournalLines.Where(line => line.LedgerAccount.TenantId == tenantId && line.LedgerAccount.Code == "CASH" && line.LedgerAccount.Currency == code && line.JournalEntry.SourceType != "investment");
        var tenant = await _context.Tenants.Where(t => t.Id == tenantId).Select(t => new { t.CapitalInicialPorMonedaJson, t.CapitalInicial }).SingleOrDefaultAsync(cancellationToken);
        if (tenant is null) return 0;
        var map = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(tenant.CapitalInicialPorMonedaJson ?? "{}") ?? new();
        var initial = map.TryGetValue(code, out var mapped) ? mapped : (code == "DOP" ? tenant.CapitalInicial : 0);
        if (!await cashLines.AnyAsync(cancellationToken)) return initial;
        var balance = initial + await cashLines.SumAsync(line => line.Debit - line.Credit, cancellationToken);
        return Math.Max(0m, balance);
    }
    public async Task EnsureCanDisburseAsync(Guid tenantId, string currency, decimal amount, CancellationToken cancellationToken = default)
    {
        if (amount <= 0) throw new ArgumentException("El desembolso debe ser positivo.");
        var code = CurrencyCatalog.Normalize(currency);
        var available = await GetAvailableAsync(tenantId, code, cancellationToken);
        if (available < amount) throw new InvalidOperationException($"Capital insuficiente para desembolsar {code} {amount:N2}. Disponible: {code} {available:N2}.");
    }
}
