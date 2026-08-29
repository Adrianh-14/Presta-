using System.Security.Cryptography;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class PasswordService : IPasswordService
{
    private const int CurrentIterations = 210_000;
    private const int SaltLength = 16;
    private const int HashLength = 32;

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            CurrentIterations,
            HashAlgorithmName.SHA256,
            HashLength);
        return $"v1${CurrentIterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string encodedHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrWhiteSpace(encodedHash)) return false;
        try
        {
            if (encodedHash.StartsWith("v1$", StringComparison.Ordinal))
            {
                var parts = encodedHash.Split('$');
                if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations) ||
                    iterations < 100_000 || iterations > 1_000_000) return false;
                var salt = Convert.FromBase64String(parts[2]);
                var expected = Convert.FromBase64String(parts[3]);
                var actual = Rfc2898DeriveBytes.Pbkdf2(
                    password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
                return CryptographicOperations.FixedTimeEquals(actual, expected);
            }

            // Compatibilidad con hashes PBKDF2-SHA256 de cuentas existentes.
            var legacy = Convert.FromBase64String(encodedHash);
            if (legacy.Length != 36) return false;
            var saltLegacy = legacy.AsSpan(0, 16).ToArray();
            var expectedLegacy = legacy.AsSpan(16, 20);
            var actualLegacy = Rfc2898DeriveBytes.Pbkdf2(
                password, saltLegacy, 100_000, HashAlgorithmName.SHA256, 20);
            return CryptographicOperations.FixedTimeEquals(actualLegacy, expectedLegacy);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
