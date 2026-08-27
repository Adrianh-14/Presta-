namespace PréstamoPlus.Application.Common;

public interface IAuditLogService
{
    Task AppendAsync(Guid tenantId, Guid? actorUserId, string action, string entityType, Guid? entityId, object? metadata = null, CancellationToken cancellationToken = default);
}
