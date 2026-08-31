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
        private readonly IPasswordService _passwords;
        private readonly ITenantAccessService _tenantAccess;

        public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IOptions<JwtSettings> jwtSettings, IPasswordService passwords, ITenantAccessService tenantAccess)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
            _passwords = passwords;
            _tenantAccess = tenantAccess;
        }

        public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(request.Request.Email);
            if (user is null || !_passwords.Verify(request.Request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Credenciales inválidas");

            if (!user.IsActive)
                throw new UnauthorizedAccessException("Cuenta desactivada");
            if (!await _tenantAccess.CanAccessAsync(user.TenantId, cancellationToken))
                throw new UnauthorizedAccessException("El acceso de tu empresa está bloqueado porque la cortesía o suscripción venció. Agrega un método de pago con tarjeta para reactivar el servicio.");

            user.LastLoginAt = DateTime.UtcNow;
            await _unitOfWork.Users.UpdateAsync(user, cancellationToken);

            Guid? collectorId = null;
            if (user.Role == "Cobrador")
            {
                var collectors = await _unitOfWork.Collectors.ListAsync(cancellationToken);
                var collector = collectors.FirstOrDefault(c => c.UserId == user.Id);
                collectorId = collector?.Id;
            }

            var tenant = await _unitOfWork.Tenants.GetByIdAsync(user.TenantId, cancellationToken);
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
                    Role = user.Role,
                    NombreEmpresa = tenant?.Nombre
                }
            };
        }

    }
}
