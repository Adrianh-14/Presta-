using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common
{
    public interface IJwtService
    {
        string GenerateAccessToken(
            User user,
            Guid? collectorId = null,
            DateTime? passwordAuthenticatedAt = null);
        string GenerateClientAccessToken(Client client, Guid sessionId, DateTime expiresAt);
        string GenerateRefreshToken();
    }
}
