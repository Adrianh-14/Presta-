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
}
