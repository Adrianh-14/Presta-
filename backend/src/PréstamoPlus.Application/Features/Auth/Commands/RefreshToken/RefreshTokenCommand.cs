using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace PréstamoPlus.Application.Features.Auth.Commands.RefreshToken
{
    public record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<AuthResponseDto>;

    public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly JwtSettings _jwtSettings;
        private readonly ITenantAccessService _tenantAccess;

        public RefreshTokenCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IOptions<JwtSettings> jwtSettings, ITenantAccessService tenantAccess)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
            _tenantAccess = tenantAccess;
        }

        public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            var storedToken = (await _unitOfWork.RefreshTokens
                .ListAsync(cancellationToken))
                .FirstOrDefault(t => t.Token == request.Request.RefreshToken);

            if (storedToken is null || !storedToken.IsActive)
                throw new UnauthorizedAccessException("Refresh token inválido o expirado");

            var user = await _unitOfWork.Users.GetByIdAsync(storedToken.UserId);
            if (user is null || !user.IsActive)
                throw new UnauthorizedAccessException("Usuario no válido");
            if (!await _tenantAccess.CanAccessAsync(user.TenantId, cancellationToken))
                throw new UnauthorizedAccessException("La cuenta de la empresa está inactiva o su suscripción no está vigente.");

            storedToken.RevokedAt = DateTime.UtcNow;
            await _unitOfWork.RefreshTokens.UpdateAsync(storedToken, cancellationToken);

            var newAccessToken = _jwtService.GenerateAccessToken(
                user,
                passwordAuthenticatedAt: user.LastLoginAt);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            var refresh = new Domain.Entities.RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = newRefreshToken,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.RefreshTokens.AddAsync(refresh, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
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
    }
}
