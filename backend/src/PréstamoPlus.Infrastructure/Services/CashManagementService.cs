using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class CashManagementService : ICashManagementService
{
    private readonly ApplicationDbContext _context;
    public CashManagementService(ApplicationDbContext context) => _context = context;

    public async Task<Guid> ImportMovementAsync(Guid tenantId, BankMovementInput movement, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || movement.Amount <= 0 || string.IsNullOrWhiteSpace(movement.ExternalReference))
            throw new ArgumentException("Movimiento bancario inválido.");
        var accountExists = await _context.CashAccounts.AnyAsync(account => account.Id == movement.CashAccountId && account.TenantId == tenantId && account.IsActive, cancellationToken);
        if (!accountExists) throw new InvalidOperationException("La cuenta no existe en el tenant.");
        if (await _context.BankMovements.AnyAsync(item => item.TenantId == tenantId && item.ExternalReference == movement.ExternalReference, cancellationToken))
            throw new InvalidOperationException("El movimiento ya fue importado.");
        var entity = new BankMovement { Id = Guid.NewGuid(), TenantId = tenantId, CashAccountId = movement.CashAccountId, OccurredAt = movement.OccurredAt, Amount = movement.Amount, IsCredit = movement.IsCredit, ExternalReference = movement.ExternalReference.Trim(), Description = movement.Description.Trim() };
        _context.BankMovements.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }

    public async Task<Guid> CloseDayAsync(Guid tenantId, DateOnly date, decimal countedBalance, Guid closedBy, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || closedBy == Guid.Empty || countedBalance < 0) throw new ArgumentException("Datos de cierre inválidos.");
        if (await _context.DailyCashClosures.AnyAsync(item => item.TenantId == tenantId && item.BusinessDate == date, cancellationToken))
            throw new InvalidOperationException("El día ya tiene un cierre; reabra con un flujo auditado.");
        var start = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);
        var expected = await _context.BankMovements.Where(item => item.TenantId == tenantId && item.OccurredAt >= start && item.OccurredAt < end)
            .SumAsync(item => item.IsCredit ? item.Amount : -item.Amount, cancellationToken);
        var closure = new DailyCashClosure { Id = Guid.NewGuid(), TenantId = tenantId, BusinessDate = date, ExpectedBalance = expected, CountedBalance = countedBalance, Difference = countedBalance - expected, ClosedBy = closedBy };
        _context.DailyCashClosures.Add(closure);
        await _context.SaveChangesAsync(cancellationToken);
        return closure.Id;
    }
}
