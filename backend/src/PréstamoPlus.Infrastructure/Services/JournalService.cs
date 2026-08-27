using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class JournalService : IJournalService
{
    private readonly ApplicationDbContext _context;

    public JournalService(ApplicationDbContext context) => _context = context;

    public async Task<Guid> PostAsync(Guid tenantId, string sourceType, Guid sourceId, IReadOnlyCollection<JournalLineInput> lines, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || string.IsNullOrWhiteSpace(sourceType) || sourceId == Guid.Empty)
            throw new ArgumentException("El asiento requiere tenant y origen válidos.");
        if (lines.Count < 2 || lines.Any(line => line.Debit < 0 || line.Credit < 0 || (line.Debit > 0 && line.Credit > 0) || (line.Debit == 0 && line.Credit == 0)))
            throw new InvalidOperationException("Cada línea debe ser débito o crédito positivo.");

        var debit = lines.Sum(line => line.Debit);
        var credit = lines.Sum(line => line.Credit);
        if (debit != credit)
            throw new InvalidOperationException("El asiento no está balanceado.");

        var accountCodes = lines.Select(line => line.AccountCode).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var accounts = await _context.LedgerAccounts
            .Where(account => account.TenantId == tenantId && accountCodes.Contains(account.Code))
            .ToDictionaryAsync(account => account.Code, cancellationToken);
        foreach (var code in accountCodes.Where(code => !accounts.ContainsKey(code)))
        {
            var account = new LedgerAccount { Id = Guid.NewGuid(), TenantId = tenantId, Code = code.ToUpperInvariant(), Name = code switch { "CASH" => "Caja y bancos", "LOAN_RECEIVABLE" => "Cartera de préstamos", "INTEREST_INCOME" => "Ingresos por intereses", "LATE_FEE_INCOME" => "Ingresos por mora", _ => code } };
            _context.LedgerAccounts.Add(account);
            accounts[code] = account;
        }

        var previousHash = await _context.JournalEntries.Where(entry => entry.TenantId == tenantId)
            .OrderByDescending(entry => entry.PostedAt).Select(entry => entry.Hash).FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        var entry = new JournalEntry { Id = Guid.NewGuid(), TenantId = tenantId, SourceType = sourceType.Trim(), SourceId = sourceId, PostedAt = DateTime.UtcNow };
        foreach (var line in lines)
            entry.Lines.Add(new JournalLine { Id = Guid.NewGuid(), LedgerAccountId = accounts[line.AccountCode].Id, Debit = line.Debit, Credit = line.Credit, Description = line.Description.Trim() });

        var canonical = JsonSerializer.Serialize(new { entry.TenantId, entry.SourceType, entry.SourceId, entry.PostedAt, PreviousHash = previousHash, Lines = entry.Lines.OrderBy(line => line.LedgerAccountId).Select(line => new { line.LedgerAccountId, line.Debit, line.Credit, line.Description }) });
        entry.Hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
        _context.JournalEntries.Add(entry);
        await _context.SaveChangesAsync(cancellationToken);
        return entry.Id;
    }

    public async Task<Guid> ReverseAsync(Guid tenantId, Guid journalEntryId, string reason, CancellationToken cancellationToken = default)
    {
        var original = await _context.JournalEntries.Include(entry => entry.Lines)
            .SingleOrDefaultAsync(entry => entry.TenantId == tenantId && entry.Id == journalEntryId, cancellationToken)
            ?? throw new InvalidOperationException("El asiento original no existe en el tenant.");
        var alreadyReversed = await _context.JournalEntries.AnyAsync(entry => entry.TenantId == tenantId && entry.SourceType == "reversal" && entry.SourceId == journalEntryId, cancellationToken);
        if (alreadyReversed) throw new InvalidOperationException("El asiento ya fue revertido.");
        return await PostAsync(tenantId, "reversal", journalEntryId, original.Lines.Select(line => new JournalLineInput(
            _context.LedgerAccounts.Where(account => account.Id == line.LedgerAccountId).Select(account => account.Code).First(),
            line.Credit, line.Debit, string.IsNullOrWhiteSpace(reason) ? "Reverso contable" : reason)).ToArray(), cancellationToken);
    }

    public Task<Guid> PostChargeOffAsync(Guid tenantId, Guid loanId, decimal amount, string reason, CancellationToken cancellationToken = default)
    {
        if (amount <= 0 || amount != decimal.Round(amount, 2)) throw new ArgumentException("El castigo debe ser positivo y tener máximo dos decimales.");
        return PostAsync(tenantId, "chargeoff", loanId, new[]
        {
            new JournalLineInput("BAD_DEBT_EXPENSE", amount, 0, string.IsNullOrWhiteSpace(reason) ? "Castigo de cartera" : reason),
            new JournalLineInput("LOAN_RECEIVABLE", 0, amount, "Baja de cartera castigada")
        }, cancellationToken);
    }
}
