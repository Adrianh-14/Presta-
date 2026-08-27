using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;
namespace PréstamoPlus.Infrastructure.Services;
public sealed class AnomalyDetectionService : IAnomalyDetectionService
{
    private readonly ApplicationDbContext _context;
    public AnomalyDetectionService(ApplicationDbContext context) => _context = context;
    public async Task<IReadOnlyList<AnomalyAlert>> ScanAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var alerts = new List<AnomalyAlert>();
        var loans = await _context.Loans.Where(x => x.TenantId == tenantId).Select(x => new { x.Id, x.MontoOriginal }).ToListAsync(cancellationToken);
        var payments = await _context.Payments.Where(x => loans.Select(l => l.Id).Contains(x.LoanId)).ToListAsync(cancellationToken);
        foreach (var group in payments.GroupBy(x => x.IdempotencyKey).Where(x => !string.IsNullOrWhiteSpace(x.Key) && x.Count() > 1))
            alerts.Add(New(tenantId, "duplicate_payment", "high", $"Idempotency-Key {group.Key} aparece {group.Count()} veces.", "Revisar y revertir el duplicado."));
        foreach (var payment in payments.Where(p => p.Monto > loans.First(l => l.Id == p.LoanId).MontoOriginal))
            alerts.Add(New(tenantId, "unusual_payment", "high", $"Pago {payment.Id} supera el principal del préstamo.", "Revisar evidencia y aplicar contra-asiento si procede."));
        alerts.AddRange(await _context.DailyCashClosures.Where(x => x.TenantId == tenantId && !x.IsReopened && Math.Abs(x.Difference) >= 0.01m)
            .Select(x => New(tenantId, "cash_difference", "medium", $"Cierre {x.BusinessDate}: diferencia RD$ {x.Difference:N2}.", "Conciliar movimiento y adjuntar evidencia.")).ToListAsync(cancellationToken));
        return alerts;
    }
    private static AnomalyAlert New(Guid tenantId, string type, string severity, string evidence, string action) => new() { Id = Guid.NewGuid(), TenantId = tenantId, Type = type, Severity = severity, Evidence = evidence, RecommendedAction = action };
}
