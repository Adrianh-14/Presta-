using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Infrastructure.Services
{
    public class JwtService : IJwtService
    {
        private readonly JwtSettings _settings;

        public JwtService(IOptions<JwtSettings> settings)
        {
            _settings = settings.Value;
        }

        public string GenerateAccessToken(User user)
        {
            return GenerateToken(user.Id, user.Email, user.Nombre, user.Role, user.TenantId, null);
        }

        public string GenerateClientAccessToken(Client client)
        {
            return GenerateToken(Guid.NewGuid(), client.Email, client.Nombre, "Cliente", client.TenantId, client.Id);
        }

        private string GenerateToken(Guid userId, string email, string nombre, string role, Guid tenantId, Guid? clientId)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new(JwtRegisteredClaimNames.Email, email),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(ClaimTypes.Name, nombre),
                new(ClaimTypes.Role, role),
                new("tenantId", tenantId.ToString())
            };

            if (clientId.HasValue)
            {
                claims.Add(new Claim("clientId", clientId.Value.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpirationMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
    }
}
