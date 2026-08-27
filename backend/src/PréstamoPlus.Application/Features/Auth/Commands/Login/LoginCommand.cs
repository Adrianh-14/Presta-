using System.Security.Cryptography;
using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace PréstamoPlus.Application.Features.Auth.Commands.Login
{
    public record LoginCommand(LoginRequest Request) : IRequest<AuthResponseDto>;

    public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly JwtSettings _jwtSettings;

        public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IOptions<JwtSettings> jwtSettings)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(request.Request.Email);
            if (user is null || !VerifyPassword(request.Request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Credenciales inválidas");

            if (!user.IsActive)
                throw new UnauthorizedAccessException("Cuenta desactivada");

            user.LastLoginAt = DateTime.UtcNow;
            await _unitOfWork.Users.UpdateAsync(user, cancellationToken);

            Guid? collectorId = null;
            if (user.Role == "Cobrador")
            {
                var collectors = await _unitOfWork.Collectors.ListAsync(cancellationToken);
                var collector = collectors.FirstOrDefault(c => c.UserId == user.Id);
                collectorId = collector?.Id;
            }

            var accessToken = _jwtService.GenerateAccessToken(user, collectorId, user.LastLoginAt);
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refresh = new Domain.Entities.RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.RefreshTokens.AddAsync(refresh, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                User = new UserDto
                {
                    Id = user.Id,
                    TenantId = user.TenantId,
                    Email = user.Email,
                    Nombre = user.Nombre,
                    Role = user.Role
                }
            };
        }

        private static bool VerifyPassword(string password, string hash)
        {
            var hashBytes = Convert.FromBase64String(hash);
            var salt = new byte[16];
            Array.Copy(hashBytes, 0, salt, 0, 16);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
            var hashToVerify = pbkdf2.GetBytes(20);

            for (int i = 0; i < 20; i++)
            {
                if (hashBytes[i + 16] != hashToVerify[i])
                    return false;
            }
            return true;
        }
    }
}
