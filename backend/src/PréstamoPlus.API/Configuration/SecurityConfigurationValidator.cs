using System.Text;

namespace PréstamoPlus.API.Configuration;

internal static class SecurityConfigurationValidator
{
    private static readonly string[] InsecureSecretMarkers =
    [
        "admin123",
        "change-me",
        "changeme",
        "example",
        "manager123",
        "operator123",
        "password",
        "prestamoplus",
        "supersecret"
    ];

    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var errors = new List<string>();

        ValidateConnectionString(configuration.GetConnectionString("DefaultConnection"), errors);
        ValidateSecret(
            configuration["JwtSettings:SecretKey"],
            "JwtSettings:SecretKey",
            minimumBytes: 32,
            errors);

        if (configuration.GetValue("ClientAuthentication:Enabled", true))
        {
            var otpPepper = configuration["ClientAuthentication:OtpPepper"];
            if (!environment.IsDevelopment() || !string.IsNullOrWhiteSpace(otpPepper))
            {
                ValidateSecret(
                    otpPepper,
                    "ClientAuthentication:OtpPepper",
                    minimumBytes: 32,
                    errors);
            }
            ValidateSecret(
                configuration["Resend:ApiKey"],
                "Resend:ApiKey",
                minimumBytes: 20,
                errors);

            if (!environment.IsDevelopment() &&
                string.IsNullOrWhiteSpace(configuration["Resend:FromEmail"]))
            {
                errors.Add("Resend:FromEmail debe usar un remitente verificado fuera de Development.");
            }

            ValidatePositiveSetting(configuration, "ClientAuthentication:OtpLifetimeMinutes", 1, 30, errors);
            ValidatePositiveSetting(configuration, "ClientAuthentication:MaximumVerificationAttempts", 1, 10, errors);
            ValidatePositiveSetting(configuration, "ClientAuthentication:RequestLimitPerWindow", 1, 20, errors);
            ValidatePositiveSetting(configuration, "ClientAuthentication:SessionLifetimeMinutes", 5, 1440, errors);
        }

        var demoDataEnabled = configuration.GetValue<bool>("DemoData:Enabled");
        if (demoDataEnabled)
        {
            if (!environment.IsDevelopment())
            {
                errors.Add("DemoData:Enabled solo puede habilitarse en Development.");
            }

            ValidateSecret(
                configuration["DemoData:Password"],
                "DemoData:Password",
                minimumBytes: 12,
                errors);
        }

        if (!environment.IsDevelopment())
        {
            if (!configuration.GetValue<bool>("Security:RealDataApproved"))
            {
                errors.Add("Security:RealDataApproved debe ser true para iniciar fuera de Development.");
            }

            var approvalReference = configuration["Security:ReleaseApprovalReference"];
            if (string.IsNullOrWhiteSpace(approvalReference) || approvalReference.Length < 8)
            {
                errors.Add("Security:ReleaseApprovalReference debe identificar la aprobación firmada de salida.");
            }
        }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                "La configuración de seguridad impide iniciar PréstamoPlus:" +
                Environment.NewLine +
                string.Join(Environment.NewLine, errors.Select(error => $"- {error}")));
        }
    }

    private static void ValidateConnectionString(string? connectionString, ICollection<string> errors)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            errors.Add("ConnectionStrings:DefaultConnection no está configurada.");
            return;
        }

        var password = connectionString
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(segment => segment.Split('=', 2, StringSplitOptions.TrimEntries))
            .Where(parts => parts.Length == 2)
            .FirstOrDefault(parts =>
                parts[0].Equals("Password", StringComparison.OrdinalIgnoreCase) ||
                parts[0].Equals("Pwd", StringComparison.OrdinalIgnoreCase))?[1];

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("ConnectionStrings:DefaultConnection debe incluir una contraseña no versionada.");
            return;
        }

        if (IsInsecure(password))
        {
            errors.Add("ConnectionStrings:DefaultConnection contiene una contraseña de ejemplo o conocida.");
        }
    }

    private static void ValidateSecret(
        string? secret,
        string key,
        int minimumBytes,
        ICollection<string> errors)
    {
        if (string.IsNullOrWhiteSpace(secret))
        {
            errors.Add($"{key} no está configurado.");
            return;
        }

        if (Encoding.UTF8.GetByteCount(secret) < minimumBytes)
        {
            errors.Add($"{key} debe tener al menos {minimumBytes} bytes.");
        }

        if (secret.Distinct().Count() < 10 || IsInsecure(secret))
        {
            errors.Add($"{key} parece ser un valor predecible o de ejemplo.");
        }
    }

    private static bool IsInsecure(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        return InsecureSecretMarkers.Any(normalized.Contains);
    }

    private static void ValidatePositiveSetting(
        IConfiguration configuration,
        string key,
        int minimum,
        int maximum,
        ICollection<string> errors)
    {
        var value = configuration.GetValue<int?>(key);
        if (value.HasValue && (value < minimum || value > maximum))
        {
            errors.Add($"{key} debe estar entre {minimum} y {maximum}.");
        }
    }
}
