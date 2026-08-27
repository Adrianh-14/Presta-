using System.Security.Cryptography;
using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace PréstamoPlus.Application.Features.Auth.Commands.Register
{
    public record RegisterCommand(RegisterRequest Request, Guid TenantId) : IRequest<AuthResponseDto>;

    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly JwtSettings _jwtSettings;

        public RegisterCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IOptions<JwtSettings> jwtSettings)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
        }

        public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            if (request.TenantId == Guid.Empty)
                throw new InvalidOperationException("No se pudo identificar la institución.");

            var role = SystemRoles.AssignableStaff.FirstOrDefault(candidate =>
                candidate.Equals(request.Request.Role?.Trim(), StringComparison.OrdinalIgnoreCase));
            if (role is null)
                throw new InvalidOperationException("El rol solicitado no está permitido.");

            if (string.IsNullOrWhiteSpace(request.Request.Password) || request.Request.Password.Length < 12)
                throw new InvalidOperationException("La contraseña debe tener al menos 12 caracteres.");

            var email = request.Request.Email.Trim().ToLowerInvariant();
            var existing = await _unitOfWork.Users.GetByEmailAsync(email);
            if (existing is not null)
                throw new InvalidOperationException("El email ya está registrado");

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                Email = email,
                PasswordHash = HashPassword(request.Request.Password),
                Nombre = request.Request.Nombre,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var accessToken = _jwtService.GenerateAccessToken(
                user,
                passwordAuthenticatedAt: user.CreatedAt);
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

        private static string HashPassword(string password)
        {
            var salt = new byte[16];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(salt);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(20);

            var hashBytes = new byte[36];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hash, 0, hashBytes, 16, 20);

            return Convert.ToBase64String(hashBytes);
        }
    }
}
