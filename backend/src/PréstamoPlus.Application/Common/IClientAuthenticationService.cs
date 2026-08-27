namespace PréstamoPlus.Application.Common;

public sealed record ClientOtpRequestResult(
    Guid ChallengeId,
    string Message,
    int ExpiresInSeconds);

public sealed record ClientAuthenticationResult(
    string Token,
    string Nombre,
    string Email,
    Guid ClientId,
    DateTime ExpiresAt);

public interface IClientAuthenticationService
{
    Task<ClientOtpRequestResult> RequestOtpAsync(
        string tenant,
        string cedula,
        string? remoteAddress,
        CancellationToken cancellationToken = default);

    Task<ClientAuthenticationResult?> VerifyOtpAsync(
        Guid challengeId,
        string tenant,
        string cedula,
        string code,
        string? remoteAddress,
        CancellationToken cancellationToken = default);

    Task RevokeSessionAsync(
        Guid sessionId,
        Guid tenantId,
        Guid clientId,
        string? remoteAddress,
        CancellationToken cancellationToken = default);
}
