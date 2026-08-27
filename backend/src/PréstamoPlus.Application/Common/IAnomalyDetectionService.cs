using PréstamoPlus.Domain.Entities;
namespace PréstamoPlus.Application.Common;
public interface IAnomalyDetectionService { Task<IReadOnlyList<AnomalyAlert>> ScanAsync(Guid tenantId, CancellationToken cancellationToken = default); }
