namespace PréstamoPlus.Application.Common;
public sealed record EntitlementsDto(string PlanId, int MaxUsers, int MaxActiveLoans, int MaxClients, int UsersUsed, int ActiveLoansUsed, int ClientsUsed);
public interface IEntitlementsService { Task<EntitlementsDto> GetAsync(Guid tenantId, CancellationToken cancellationToken = default); }
