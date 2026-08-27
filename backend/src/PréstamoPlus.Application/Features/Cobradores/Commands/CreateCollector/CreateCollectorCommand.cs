using System.Security.Cryptography;
using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Cobradores.Commands.CreateCollector
{
    public record CreateCollectorCommand(CreateCollectorRequest Request, Guid TenantId) : IRequest<CollectorDto>;

    public class CreateCollectorCommandHandler : IRequestHandler<CreateCollectorCommand, CollectorDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateCollectorCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CollectorDto> Handle(CreateCollectorCommand request, CancellationToken cancellationToken)
        {
            var req = request.Request;

            var existing = await _unitOfWork.Users.GetByEmailAsync(req.Email);
            if (existing is not null)
                throw new InvalidOperationException("El email ya está registrado.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantId = request.TenantId,
                    Email = req.Email,
                    PasswordHash = HashPassword(req.Password),
                    Nombre = req.Nombre,
                    Role = "Cobrador",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user, cancellationToken);

                var collector = new Collector
                {
                    Id = Guid.NewGuid(),
                    TenantId = request.TenantId,
                    UserId = user.Id,
                    Cedula = req.Cedula,
                    Telefono = req.Telefono,
                    Zona = req.Zona,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Collectors.AddAsync(collector, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return new CollectorDto
                {
                    Id = collector.Id,
                    UserId = user.Id,
                    Nombre = user.Nombre,
                    Email = user.Email,
                    Cedula = collector.Cedula,
                    Telefono = collector.Telefono,
                    Zona = collector.Zona,
                    IsActive = collector.IsActive,
                    CreatedAt = collector.CreatedAt
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
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
