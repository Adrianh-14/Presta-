using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class CapitalGuardService : ICapitalGuardService
{
    private readonly ApplicationDbContext _context;
    public CapitalGuardService(ApplicationDbContext context) => _context = context;
    public async Task<decimal> GetAvailableAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty) return 0;
        var cashLines = _context.JournalLines.Where(line => line.LedgerAccount.TenantId == tenantId && line.LedgerAccount.Code == "CASH");
        if (!await cashLines.AnyAsync(cancellationToken))
            return await _context.TenantConfigs.Where(config => config.TenantId == tenantId)
                .Select(config => config.CapitalInicial).SingleOrDefaultAsync(cancellationToken);
        return await cashLines.SumAsync(line => line.Debit - line.Credit, cancellationToken);
    }
    public async Task EnsureCanDisburseAsync(Guid tenantId, decimal amount, CancellationToken cancellationToken = default)
    {
        if (amount <= 0) throw new ArgumentException("El desembolso debe ser positivo.");
        var available = await GetAvailableAsync(tenantId, cancellationToken);
        if (available < amount) throw new InvalidOperationException($"Capital insuficiente para desembolsar RD$ {amount:N2}. Disponible: RD$ {available:N2}.");
    }
}
