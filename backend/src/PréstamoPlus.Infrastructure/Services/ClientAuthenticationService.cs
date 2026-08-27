using System.Data;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class ClientAuthenticationService : IClientAuthenticationService
{
    private const string PublicRequestMessage =
        "Si los datos coinciden con una cuenta activa, enviaremos un código de acceso.";

    private readonly ApplicationDbContext _context;
    private readonly IClientOtpDeliveryQueue _deliveryQueue;
    private readonly IJwtService _jwtService;
    private readonly ClientAuthenticationOptions _options;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<ClientAuthenticationService> _logger;
    private readonly byte[] _pepper;

    public ClientAuthenticationService(
        ApplicationDbContext context,
        IClientOtpDeliveryQueue deliveryQueue,
        IJwtService jwtService,
        IOptions<ClientAuthenticationOptions> options,
        TimeProvider timeProvider,
        ILogger<ClientAuthenticationService> logger)
    {
        _context = context;
        _deliveryQueue = deliveryQueue;
        _jwtService = jwtService;
        _options = options.Value;
        _timeProvider = timeProvider;
        _logger = logger;
        _pepper = Encoding.UTF8.GetBytes(_options.OtpPepper);
    }

    public async Task<ClientOtpRequestResult> RequestOtpAsync(
        string tenant,
        string cedula,
        string? remoteAddress,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var now = UtcNow();
        var tenantSlug = NormalizeTenant(tenant);
        var identifier = NormalizeIdentifier(cedula);
        var identifierHash = Hash($"identifier:{tenantSlug}:{identifier}");
        var addressHash = HashOptional(remoteAddress, "address");
        var publicChallengeId = Guid.NewGuid();

        if (!_options.Enabled || !IsValidTenant(tenantSlug) || !IsValidIdentifier(identifier))
        {
            await RecordEventAsync(
                null,
                null,
                publicChallengeId,
                null,
                "OtpRequested",
                "Rejected",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            await DelayUniformlyAsync(stopwatch, cancellationToken);
            return PublicRequestResult(publicChallengeId);
        }

        var tenantEntity = await _context.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.IsActive && item.Slug.ToLower() == tenantSlug,
                cancellationToken);

        var client = tenantEntity is null
            ? null
            : await FindClientAsync(tenantEntity.Id, cedula, identifier, cancellationToken);

        if (client is null || client.Estado != EstadoCliente.Activo || string.IsNullOrWhiteSpace(client.Email))
        {
            await RecordEventAsync(
                tenantEntity?.Id,
                null,
                publicChallengeId,
                null,
                "OtpRequested",
                "NotMatched",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            await DelayUniformlyAsync(stopwatch, cancellationToken);
            return PublicRequestResult(publicChallengeId);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var latestChallenge = await _context.ClientOtpChallenges
            .Where(item => item.TenantId == client.TenantId && item.ClientId == client.Id)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var windowStart = now.AddMinutes(-Math.Max(1, _options.RequestWindowMinutes));
        var sentInWindow = await _context.ClientOtpChallenges.CountAsync(
            item => item.TenantId == client.TenantId &&
                    item.ClientId == client.Id &&
                    item.CreatedAt >= windowStart,
            cancellationToken);

        var isLocked = latestChallenge?.LockedUntil > now;
        var isCoolingDown = latestChallenge is not null &&
            latestChallenge.CreatedAt.AddSeconds(Math.Max(0, _options.RequestCooldownSeconds)) > now;
        var requestLimitReached = sentInWindow >= Math.Max(1, _options.RequestLimitPerWindow);

        if (isLocked || isCoolingDown || requestLimitReached)
        {
            var challengeId = latestChallenge?.Id ?? publicChallengeId;
            await RecordEventAsync(
                client.TenantId,
                client.Id,
                challengeId,
                null,
                "OtpRequested",
                isLocked ? "Locked" : "Suppressed",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            await DelayUniformlyAsync(stopwatch, cancellationToken);
            return PublicRequestResult(challengeId);
        }

        var activeChallenges = await _context.ClientOtpChallenges
            .Where(item => item.TenantId == client.TenantId &&
                           item.ClientId == client.Id &&
                           item.ConsumedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var activeChallenge in activeChallenges)
        {
            activeChallenge.ConsumedAt = now;
        }

        var challengeIdToSend = Guid.NewGuid();
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var lifetimeMinutes = Math.Clamp(_options.OtpLifetimeMinutes, 1, 30);
        var challenge = new ClientOtpChallenge
        {
            Id = challengeIdToSend,
            TenantId = client.TenantId,
            ClientId = client.Id,
            CodeHash = HashCode(challengeIdToSend, client.TenantId, client.Id, code),
            IdentifierHash = identifierHash,
            RequestAddressHash = addressHash,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(lifetimeMinutes)
        };
        _context.ClientOtpChallenges.Add(challenge);

        if (activeChallenges.Count > 0)
        {
            await RecordEventAsync(
                client.TenantId,
                client.Id,
                challenge.Id,
                null,
                "AccessRecovery",
                "ChallengeRotated",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
        }

        await RecordEventAsync(
            client.TenantId,
            client.Id,
            challenge.Id,
            null,
            "OtpRequested",
            "Created",
            identifierHash,
            addressHash,
            now,
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // Never expose an OTP to the delivery worker until its challenge and
        // one-time hash are durably committed.
        var queued = _deliveryQueue.TryQueue(new ClientOtpDelivery(
            client.Email,
            client.Nombre,
            code,
            lifetimeMinutes));

        await RecordEventAsync(
            client.TenantId,
            client.Id,
            challenge.Id,
            null,
            "OtpDelivery",
            queued ? "Queued" : "QueueUnavailable",
            identifierHash,
            addressHash,
            UtcNow(),
            cancellationToken);

        if (!queued)
        {
            _logger.LogWarning("La cola de OTP rechazó una entrega. ChallengeId: {ChallengeId}", challenge.Id);
        }

        await DelayUniformlyAsync(stopwatch, cancellationToken);
        return PublicRequestResult(challenge.Id);
    }

    public async Task<ClientAuthenticationResult?> VerifyOtpAsync(
        Guid challengeId,
        string tenant,
        string cedula,
        string code,
        string? remoteAddress,
        CancellationToken cancellationToken = default)
    {
        var now = UtcNow();
        var tenantSlug = NormalizeTenant(tenant);
        var identifier = NormalizeIdentifier(cedula);
        var identifierHash = Hash($"identifier:{tenantSlug}:{identifier}");
        var addressHash = HashOptional(remoteAddress, "address");

        if (!_options.Enabled || challengeId == Guid.Empty || !IsValidTenant(tenantSlug) ||
            !IsValidIdentifier(identifier) || code.Length != 6 || !code.All(char.IsDigit))
        {
            await RecordEventAsync(
                null,
                null,
                challengeId == Guid.Empty ? null : challengeId,
                null,
                "OtpVerification",
                "Rejected",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            return null;
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var challenge = await _context.ClientOtpChallenges
            .SingleOrDefaultAsync(item => item.Id == challengeId, cancellationToken);

        if (challenge is null)
        {
            await RecordEventAsync(
                null,
                null,
                challengeId,
                null,
                "OtpVerification",
                "NotMatched",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        var tenantEntity = await _context.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == challenge.TenantId && item.IsActive, cancellationToken);
        var client = tenantEntity is null || !tenantEntity.Slug.Equals(tenantSlug, StringComparison.OrdinalIgnoreCase)
            ? null
            : await FindClientAsync(challenge.TenantId, cedula, identifier, cancellationToken);

        var identifierMatches = CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(challenge.IdentifierHash),
            Convert.FromHexString(identifierHash));
        var isUnavailable = challenge.ConsumedAt.HasValue ||
            challenge.ExpiresAt <= now ||
            challenge.LockedUntil > now ||
            client?.Id != challenge.ClientId ||
            !identifierMatches;

        if (isUnavailable || !CodeMatches(challenge, code))
        {
            challenge.FailedAttempts++;
            var maximumAttempts = Math.Clamp(_options.MaximumVerificationAttempts, 1, 10);
            if (challenge.FailedAttempts >= maximumAttempts)
            {
                challenge.LockedUntil = now.AddMinutes(Math.Clamp(_options.LockoutMinutes, 1, 1440));
            }

            await RecordEventAsync(
                challenge.TenantId,
                challenge.ClientId,
                challenge.Id,
                null,
                "OtpVerification",
                challenge.LockedUntil > now ? "Locked" : "Failed",
                identifierHash,
                addressHash,
                now,
                cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        challenge.ConsumedAt = now;
        var sessionExpiresAt = now.AddMinutes(Math.Clamp(_options.SessionLifetimeMinutes, 5, 1440));
        var session = new ClientSession
        {
            Id = Guid.NewGuid(),
            TenantId = challenge.TenantId,
            ClientId = challenge.ClientId,
            CreatedAt = now,
            ExpiresAt = sessionExpiresAt,
            CreatedAddressHash = addressHash
        };
        _context.ClientSessions.Add(session);

        await RecordEventAsync(
            challenge.TenantId,
            challenge.ClientId,
            challenge.Id,
            session.Id,
            "SessionIssued",
            "Succeeded",
            identifierHash,
            addressHash,
            now,
            cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var token = _jwtService.GenerateClientAccessToken(client!, session.Id, sessionExpiresAt);
        return new ClientAuthenticationResult(
            token,
            client!.Nombre,
            client.Email,
            client.Id,
            sessionExpiresAt);
    }

    public async Task RevokeSessionAsync(
        Guid sessionId,
        Guid tenantId,
        Guid clientId,
        string? remoteAddress,
        CancellationToken cancellationToken = default)
    {
        var now = UtcNow();
        var addressHash = HashOptional(remoteAddress, "address");
        var session = await _context.ClientSessions.SingleOrDefaultAsync(
            item => item.Id == sessionId && item.TenantId == tenantId && item.ClientId == clientId,
            cancellationToken);

        if (session is null)
        {
            return;
        }

        session.RevokedAt ??= now;
        await RecordEventAsync(
            tenantId,
            clientId,
            null,
            sessionId,
            "SessionRevoked",
            "Succeeded",
            Hash($"client:{tenantId:N}:{clientId:N}"),
            addressHash,
            now,
            cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Client?> FindClientAsync(
        Guid tenantId,
        string rawIdentifier,
        string normalizedIdentifier,
        CancellationToken cancellationToken)
    {
        var candidates = IdentifierCandidates(rawIdentifier, normalizedIdentifier);
        return await _context.Clients
            .AsNoTracking()
            .OrderBy(client => client.Id)
            .FirstOrDefaultAsync(
                client => client.TenantId == tenantId && candidates.Contains(client.Cedula),
                cancellationToken);
    }

    private ClientOtpRequestResult PublicRequestResult(Guid challengeId) => new(
        challengeId,
        PublicRequestMessage,
        Math.Clamp(_options.OtpLifetimeMinutes, 1, 30) * 60);

    private async Task RecordEventAsync(
        Guid? tenantId,
        Guid? clientId,
        Guid? challengeId,
        Guid? sessionId,
        string eventType,
        string outcome,
        string identifierHash,
        string? addressHash,
        DateTime createdAt,
        CancellationToken cancellationToken)
    {
        _context.ClientAuthenticationEvents.Add(new ClientAuthenticationEvent
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClientId = clientId,
            ChallengeId = challengeId,
            SessionId = sessionId,
            EventType = eventType,
            Outcome = outcome,
            IdentifierHash = identifierHash,
            RemoteAddressHash = addressHash,
            CreatedAt = createdAt
        });
        await _context.SaveChangesAsync(cancellationToken);
    }

    private bool CodeMatches(ClientOtpChallenge challenge, string code)
    {
        var expected = Convert.FromHexString(challenge.CodeHash);
        var actual = Convert.FromHexString(HashCode(
            challenge.Id,
            challenge.TenantId,
            challenge.ClientId,
            code));
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }

    private string HashCode(Guid challengeId, Guid tenantId, Guid clientId, string code) =>
        Hash($"otp:{challengeId:N}:{tenantId:N}:{clientId:N}:{code}");

    private string Hash(string value) => Convert.ToHexString(
        HMACSHA256.HashData(_pepper, Encoding.UTF8.GetBytes(value)));

    private string? HashOptional(string? value, string purpose) =>
        string.IsNullOrWhiteSpace(value) ? null : Hash($"{purpose}:{value.Trim()}");

    private DateTime UtcNow() => _timeProvider.GetUtcNow().UtcDateTime;

    private async Task DelayUniformlyAsync(Stopwatch stopwatch, CancellationToken cancellationToken)
    {
        var minimum = Math.Clamp(_options.MinimumResponseMilliseconds, 0, 2000);
        var remaining = minimum - (int)stopwatch.ElapsedMilliseconds;
        if (remaining > 0)
        {
            await Task.Delay(remaining, cancellationToken);
        }
    }

    private static string NormalizeTenant(string value) => value.Trim().ToLowerInvariant();

    private static string NormalizeIdentifier(string value) => new(
        value.Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant)
            .ToArray());

    private static bool IsValidTenant(string value) =>
        value.Length is >= 2 and <= 100 && value.All(character =>
            char.IsLetterOrDigit(character) || character == '-');

    private static bool IsValidIdentifier(string value) => value.Length is >= 5 and <= 32;

    private static string[] IdentifierCandidates(string raw, string normalized)
    {
        var values = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            raw.Trim(),
            normalized
        };

        if (normalized.Length == 11 && normalized.All(char.IsDigit))
        {
            values.Add($"{normalized[..3]}-{normalized.Substring(3, 7)}-{normalized[^1]}");
        }

        return values.ToArray();
    }
}
