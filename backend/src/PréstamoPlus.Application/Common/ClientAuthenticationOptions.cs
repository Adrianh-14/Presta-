namespace PréstamoPlus.Application.Common;

public sealed class ClientAuthenticationOptions
{
    public const string SectionName = "ClientAuthentication";

    public bool Enabled { get; set; } = true;
    public string OtpPepper { get; set; } = string.Empty;
    public int OtpLifetimeMinutes { get; set; } = 10;
    public int MaximumVerificationAttempts { get; set; } = 5;
    public int RequestCooldownSeconds { get; set; } = 60;
    public int RequestLimitPerWindow { get; set; } = 5;
    public int RequestWindowMinutes { get; set; } = 15;
    public int LockoutMinutes { get; set; } = 15;
    public int SessionLifetimeMinutes { get; set; } = 15;
    public int MinimumResponseMilliseconds { get; set; } = 250;
}
