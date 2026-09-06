using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Domain;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed partial class TenantRegistrationService : ITenantRegistrationService
{
    private readonly ApplicationDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly IJwtService _jwt;
    private readonly JwtSettings _jwtSettings;

    public TenantRegistrationService(
        ApplicationDbContext db,
        IPasswordService passwords,
        IJwtService jwt,
        IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _passwords = passwords;
        _jwt = jwt;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponseDto> RegisterAsync(
        TenantRegistrationRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request);
        var now = DateTime.UtcNow;
        var email = request.Email.Trim().ToLowerInvariant();
        var rnc = NormalizeOptional(request.Rnc);
        var phone = NormalizeOptional(request.Phone);
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        if (await _db.Users.AnyAsync(user => user.Email == email, cancellationToken))
            throw new InvalidOperationException("Ya existe una cuenta con ese correo.");
        if (rnc is not null && await _db.Tenants.AnyAsync(tenant => tenant.RNC == rnc, cancellationToken))
            throw new InvalidOperationException("Ya existe una empresa registrada con ese RNC.");

        var uploadsDir = GetUploadsDirectory();
        var representativeIdPhoto = SaveBase64Image(request.RepresentativeIdPhoto, uploadsDir, $"{tenantId}_representative-id");
        var representativePhoto = SaveBase64Image(request.RepresentativePhoto, uploadsDir, $"{tenantId}_representative");

        var tenant = new Tenant
        {
            Id = tenantId,
            Nombre = request.BusinessName.Trim(),
            Slug = await CreateUniqueSlugAsync(request.BusinessName, cancellationToken),
            RNC = rnc,
            Email = email,
            Telefono = phone,
            CapitalInicial = request.InitialCapital,
            CapitalInicialUsd = request.InitialCapitalUsd,
            CapitalInicialEur = request.InitialCapitalEur,
            MonedasHabilitadas = string.Join(',', request.EnabledCurrencies.Where(CurrencyCatalog.IsSupported).Select(CurrencyCatalog.Normalize).Distinct()),
            CapitalInicialPorMonedaJson = System.Text.Json.JsonSerializer.Serialize(request.InitialCapitalByCurrency.Where(x => CurrencyCatalog.IsSupported(x.Key)).ToDictionary(x => CurrencyCatalog.Normalize(x.Key), x => x.Value)),
            TipoEmpresa = request.CompanyType!.Trim(),
            ActividadEconomica = request.EconomicActivity!.Trim(),
            Direccion = request.Address!.Trim(),
            Ciudad = request.City!.Trim(),
            Provincia = request.Province!.Trim(),
            Pais = string.IsNullOrWhiteSpace(request.Country) ? "DO" : request.Country.Trim().ToUpperInvariant(),
            SitioWeb = NormalizeOptional(request.Website),
            CantidadEmpleados = request.EmployeeCount,
            RepresentanteTipoIdentificacion = request.RepresentativeIdType!.Trim(),
            RepresentanteNumeroIdentificacion = request.RepresentativeIdNumber!.Trim(),
            RepresentanteFotoIdentificacionPath = representativeIdPhoto,
            RepresentanteFotoPath = representativePhoto,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        var user = new User
        {
            Id = userId,
            TenantId = tenantId,
            Email = email,
            PasswordHash = _passwords.Hash(request.Password),
            Nombre = request.OwnerName.Trim(),
            Role = SystemRoles.Admin,
            IsActive = true,
            CreatedAt = now
        };
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PlanId = "basic",
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = now,
            CurrentPeriodEnd = now.AddYears(100),
            TrialEndsAt = null,
            IsComplimentary = true,
            ComplimentaryUntil = now.AddYears(100),
            ComplimentaryNote = "Acceso gratuito vigente",
            CreatedAt = now
        };
        var promotion = await _db.PlatformPromotions.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.AppliesToNewTenants && x.StartsAt <= now && x.EndsAt > now, cancellationToken);
        if (promotion is not null) { subscription.IsComplimentary = true; subscription.ComplimentaryUntil = promotion.EndsAt; subscription.ComplimentaryNote = promotion.Label; }
        var refreshValue = _jwt.GenerateRefreshToken();
        var refresh = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = refreshValue,
            Expires = now.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = now
        };

        _db.Tenants.Add(tenant);
        _db.Users.Add(user);
        _db.Subscriptions.Add(subscription);
        _db.TenantConfigs.Add(new TenantConfig { Id = Guid.NewGuid(), TenantId = tenantId, CapitalInicial = request.InitialCapital, CapitalInicialUsd = request.InitialCapitalUsd, CapitalInicialEur = request.InitialCapitalEur });
        _db.RefreshTokens.Add(refresh);
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new AuthResponseDto
        {
            AccessToken = _jwt.GenerateAccessToken(user, passwordAuthenticatedAt: now),
            RefreshToken = refreshValue,
            ExpiresAt = now.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            User = new UserDto
            {
                Id = user.Id,
                TenantId = tenant.Id,
                Email = user.Email,
                Nombre = user.Nombre,
                Role = user.Role,
                NombreEmpresa = tenant.Nombre
            }
        };
    }

    private static void Validate(TenantRegistrationRequest request)
    {
        if (request.BusinessName.Trim().Length is < 2 or > 200)
            throw new InvalidOperationException("El nombre de la empresa debe tener entre 2 y 200 caracteres.");
        if (request.OwnerName.Trim().Length is < 2 or > 200)
            throw new InvalidOperationException("Indica el nombre del responsable de la cuenta.");
        if (!EmailPattern().IsMatch(request.Email.Trim()) || request.Email.Length > 200)
            throw new InvalidOperationException("El correo electrónico no es válido.");
        if (request.Password.Length < 12 ||
            !request.Password.Any(char.IsUpper) || !request.Password.Any(char.IsLower) ||
            !request.Password.Any(char.IsDigit) || !request.Password.Any(ch => !char.IsLetterOrDigit(ch)))
            throw new InvalidOperationException("La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo.");
        if (!request.AcceptTerms)
            throw new InvalidOperationException("Debes aceptar los términos y la política de privacidad.");
        if (request.InitialCapital < 0 || request.InitialCapital > 1_000_000_000m)
            throw new InvalidOperationException("El capital inicial debe estar entre RD$ 0 y RD$ 1,000,000,000.");
        if (request.InitialCapitalUsd < 0 || request.InitialCapitalEur < 0)
            throw new InvalidOperationException("El capital inicial no puede ser negativo.");
        if (request.EnabledCurrencies.Count == 0 || request.EnabledCurrencies.Any(x => !CurrencyCatalog.IsSupported(x)))
            throw new InvalidOperationException("Selecciona divisas válidas.");
        if (request.InitialCapitalByCurrency.Any(x => x.Value < 0 || !CurrencyCatalog.IsSupported(x.Key)))
            throw new InvalidOperationException("El capital inicial por divisa no es válido.");
        Require(request.CompanyType, "Selecciona el tipo de empresa.");
        Require(request.EconomicActivity, "Indica la actividad económica de la empresa.");
        Require(request.Address, "Indica la dirección de la empresa.");
        Require(request.City, "Indica la ciudad de la empresa.");
        Require(request.Province, "Indica la provincia de la empresa.");
        Require(request.RepresentativeIdType, "Selecciona el tipo de identificación del representante.");
        Require(request.RepresentativeIdNumber, "Indica el número de identificación del representante.");
        Require(request.RepresentativeIdPhoto, "Adjunta una foto de la identificación del representante.", 8 * 1024 * 1024);
        Require(request.RepresentativePhoto, "Adjunta una foto del representante.", 8 * 1024 * 1024);
        if (request.EmployeeCount is < 1 or > 100_000)
            throw new InvalidOperationException("La cantidad de empleados debe estar entre 1 y 100,000.");
    }

    private static void Require(string? value, string message, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new InvalidOperationException(message);
        if (value.Length > maxLength) throw new InvalidOperationException("Uno de los datos ingresados excede el tamaño permitido.");
    }

    private static string GetUploadsDirectory()
    {
        var configured = Environment.GetEnvironmentVariable("UPLOADS_PATH");
        var directory = string.IsNullOrWhiteSpace(configured)
            ? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "uploads"))
            : configured;
        Directory.CreateDirectory(directory);
        return directory;
    }

    private static string SaveBase64Image(string? data, string uploadsDir, string prefix)
    {
        if (string.IsNullOrWhiteSpace(data)) throw new InvalidOperationException("La imagen requerida no fue recibida.");
        var comma = data.IndexOf(',');
        var header = comma >= 0 ? data[..comma] : string.Empty;
        var payload = comma >= 0 ? data[(comma + 1)..] : data;
        var extension = header.Contains("image/png", StringComparison.OrdinalIgnoreCase) ? "png" :
            header.Contains("image/webp", StringComparison.OrdinalIgnoreCase) ? "webp" : "jpg";
        byte[] bytes;
        try { bytes = Convert.FromBase64String(payload); }
        catch (FormatException) { throw new InvalidOperationException("Una de las imágenes no tiene un formato válido."); }
        if (bytes.Length is 0 or > 5 * 1024 * 1024) throw new InvalidOperationException("Cada imagen debe pesar como máximo 5 MB.");
        var fileName = $"{prefix}_{Guid.NewGuid():N}.{extension}";
        File.WriteAllBytes(Path.Combine(uploadsDir, fileName), bytes);
        return fileName;
    }

    private async Task<string> CreateUniqueSlugAsync(string businessName, CancellationToken cancellationToken)
    {
        var normalized = businessName.Normalize(NormalizationForm.FormD);
        var ascii = new string(normalized.Where(ch => CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark).ToArray());
        var root = SlugCleanup().Replace(ascii.ToLowerInvariant(), "-").Trim('-');
        root = string.IsNullOrWhiteSpace(root) ? "empresa" : root[..Math.Min(root.Length, 82)];
        var candidate = root;
        var suffix = 1;
        while (await _db.Tenants.AnyAsync(tenant => tenant.Slug == candidate, cancellationToken))
            candidate = $"{root}-{++suffix}";
        return candidate;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.CultureInvariant)]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"[^a-z0-9]+", RegexOptions.CultureInvariant)]
    private static partial Regex SlugCleanup();
}
