using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common
{
    public interface IJwtService
    {
        string GenerateAccessToken(User user);
        string GenerateClientAccessToken(Client client);
        string GenerateRefreshToken();
    }
}
