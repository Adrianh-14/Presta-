using MediatR;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Clients.Commands.RegisterClient
{
    public record RegisterClientRequest
    {
        public Guid? TenantId { get; init; }
        public ClientDto Client { get; init; } = null!;
        public WorkInformationDto WorkInformation { get; init; } = null!;
        public AddressDto Address { get; init; } = null!;
        public List<ReferenceDto> References { get; init; } = new();
        public BankAccountDto BankAccount { get; init; } = null!;
        public VerificationMediaDto? VerificationMedia { get; init; }
        public bool ConsentAccepted { get; init; }
    }

    public record RegisterClientCommand(RegisterClientRequest Request) : IRequest<ClientDto>;

    public class RegisterClientCommandHandler : IRequestHandler<RegisterClientCommand, ClientDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public RegisterClientCommandHandler(
            IUnitOfWork unitOfWork,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
        }

        public async Task<ClientDto> Handle(RegisterClientCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;
            if (!req.ConsentAccepted)
                throw new InvalidOperationException("Se requiere aceptar el consentimiento de datos para registrarse.");
            if (!req.TenantId.HasValue || req.TenantId.Value == Guid.Empty)
                throw new InvalidOperationException("El registro requiere un tenant válido.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var client = new Client
                {
                    Id = Guid.NewGuid(),
                    TenantId = req.TenantId.Value,
                    DataConsentAt = DateTime.UtcNow,
                    CreditEvaluationConsentAt = DateTime.UtcNow,
                    CommunicationsConsentAt = DateTime.UtcNow,
                    Nombre = req.Client.Nombre,
                    Cedula = req.Client.Cedula,
                    Email = req.Client.Email,
                    Telefono = req.Client.Telefono,
                    FechaNacimiento = DateTime.SpecifyKind(req.Client.FechaNacimiento, DateTimeKind.Utc),
                    EstadoCivil = req.Client.EstadoCivil
                };
                await _unitOfWork.Clients.AddAsync(client);

                var workInfo = new WorkInformation
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Empresa = req.WorkInformation.Empresa,
                    Cargo = req.WorkInformation.Cargo,
                    Salario = req.WorkInformation.Salario,
                    AntiguedadAnios = req.WorkInformation.AntiguedadAnios,
                    DireccionEmpresa = req.WorkInformation.DireccionEmpresa,
                    TelefonoEmpresa = req.WorkInformation.TelefonoEmpresa,
                    TipoEmpleo = req.WorkInformation.TipoEmpleo
                };
                await _unitOfWork.WorkInformation.AddAsync(workInfo);

                var address = new Address
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Direccion = req.Address.Direccion,
                    Ciudad = req.Address.Ciudad,
                    Provincia = req.Address.Provincia,
                    Sector = req.Address.Sector,
                    CodigoPostal = req.Address.CodigoPostal
                };
                await _unitOfWork.Addresses.AddAsync(address);

                foreach (var refDto in req.References)
                {
                    await _unitOfWork.References.AddAsync(new Reference
                    {
                        Id = Guid.NewGuid(),
                        ClientId = client.Id,
                        Nombre = refDto.Nombre,
                        Relacion = refDto.Relacion,
                        Telefono = refDto.Telefono,
                        Email = refDto.Email
                    });
                }

                var bankAccount = new BankAccount
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Banco = req.BankAccount.Banco,
                    TipoCuenta = req.BankAccount.TipoCuenta,
                    NumeroCuenta = req.BankAccount.NumeroCuenta
                };
                await _unitOfWork.BankAccounts.AddAsync(bankAccount);

                if (req.VerificationMedia != null)
                {
                    var uploadsDir = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "uploads");
                    if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

                    string? videoPath = null;
                    string? fotoPath = null;

                    if (!string.IsNullOrEmpty(req.VerificationMedia.VideoPath))
                    {
                        videoPath = SaveBase64File(req.VerificationMedia.VideoPath, uploadsDir, $"{client.Id}_video.webm");
                    }
                    if (!string.IsNullOrEmpty(req.VerificationMedia.FotoCedulaPath))
                    {
                        fotoPath = SaveBase64File(req.VerificationMedia.FotoCedulaPath, uploadsDir, $"{client.Id}_foto.jpg");
                    }

                    await _unitOfWork.VerificationMedia.AddAsync(new VerificationMedia
                    {
                        Id = Guid.NewGuid(),
                        ClientId = client.Id,
                        VideoPath = videoPath,
                        FotoCedulaPath = fotoPath
                    });
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                var email = ClientEmailBuilder.Registered(client, _notificationService.ClientPortalUrl);
                await _notificationService.SendEmailAsync(client.Email, email.Subject, email.Html);

                return new ClientDto
                {
                    Id = client.Id,
                    Nombre = client.Nombre,
                    Cedula = client.Cedula,
                    Email = client.Email,
                    Telefono = client.Telefono,
                    FechaNacimiento = client.FechaNacimiento,
                    EstadoCivil = client.EstadoCivil,
                    Estado = client.Estado,
                    FechaRegistro = client.FechaRegistro
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }

        private static string SaveBase64File(string base64Data, string uploadsDir, string fileName)
        {
            var data = base64Data;
            var mimeType = "";
            if (data.StartsWith("data:"))
            {
                var parts = data.Split(',');
                mimeType = parts[0].Split(':')[1].Split(';')[0];
                data = parts[1];
            }
            var extension = mimeType switch
            {
                "video/webm" => ".webm",
                "video/mp4" => ".mp4",
                "image/jpeg" or "image/jpg" => ".jpg",
                "image/png" => ".png",
                _ => Path.GetExtension(fileName)
            };
            var finalName = Path.GetFileNameWithoutExtension(fileName) + extension;
            var filePath = Path.Combine(uploadsDir, finalName);
            File.WriteAllBytes(filePath, Convert.FromBase64String(data));
            return finalName;
        }
    }
}
