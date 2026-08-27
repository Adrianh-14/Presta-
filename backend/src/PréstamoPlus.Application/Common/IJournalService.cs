namespace PréstamoPlus.Application.Common;

public sealed record JournalLineInput(string AccountCode, decimal Debit, decimal Credit, string Description);

public interface IJournalService
{
    Task<Guid> PostAsync(Guid tenantId, string sourceType, Guid sourceId, IReadOnlyCollection<JournalLineInput> lines, CancellationToken cancellationToken = default);
    Task<Guid> ReverseAsync(Guid tenantId, Guid journalEntryId, string reason, CancellationToken cancellationToken = default);
    Task<Guid> PostChargeOffAsync(Guid tenantId, Guid loanId, decimal amount, string reason, CancellationToken cancellationToken = default);
}
