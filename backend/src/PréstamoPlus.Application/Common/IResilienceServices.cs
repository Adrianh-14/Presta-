namespace PréstamoPlus.Application.Common;

public interface IOutboxService
{
    Task EnqueueAsync(Guid tenantId, string type, string payload, CancellationToken cancellationToken = default);
}

public interface IDistributedJobLock
{
    Task<bool> TryAcquireAsync(string name, string owner, TimeSpan lease, CancellationToken cancellationToken = default);
    Task ReleaseAsync(string name, string owner, CancellationToken cancellationToken = default);
}
