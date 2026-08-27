using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Services;
using Xunit;

namespace PréstamoPlus.Infrastructure.Tests;

public sealed class ClientAuthenticationServiceTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private ApplicationDbContext _context = null!;
    private TestTimeProvider _time = null!;
    private CapturingOtpQueue _queue = null!;
    private ClientAuthenticationOptions _options = null!;
    private ClientAuthenticationService _service = null!;
    private Tenant _tenantA = null!;
    private Tenant _tenantB = null!;
    private Client _clientA = null!;
    private Client _clientB = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var databaseOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new ApplicationDbContext(databaseOptions);
        await _context.Database.EnsureCreatedAsync();

        _time = new TestTimeProvider(new DateTimeOffset(2026, 8, 23, 12, 0, 0, TimeSpan.Zero));
        _queue = new CapturingOtpQueue();
        _options = new ClientAuthenticationOptions
        {
            Enabled = true,
            OtpPepper = "test-only-pepper-with-more-than-thirty-two-bytes",
            OtpLifetimeMinutes = 10,
            MaximumVerificationAttempts = 5,
            RequestCooldownSeconds = 0,
            RequestLimitPerWindow = 5,
            RequestWindowMinutes = 15,
            LockoutMinutes = 15,
            SessionLifetimeMinutes = 15,
            MinimumResponseMilliseconds = 0
        };

        _tenantA = new Tenant
        {
            Id = Guid.NewGuid(),
            Nombre = "Financiera Uno",
            Slug = "financiera-uno",
            IsActive = true
        };
        _tenantB = new Tenant
        {
            Id = Guid.NewGuid(),
            Nombre = "Financiera Dos",
            Slug = "financiera-dos",
            IsActive = true
        };
        _clientA = CreateClient(_tenantA.Id, "cliente-a@example.test");
        _clientB = CreateClient(_tenantB.Id, "cliente-b@example.test");

        _context.AddRange(_tenantA, _tenantB, _clientA, _clientB);
        await _context.SaveChangesAsync();
        RecreateService();
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task ExistingAndUnknownIdentifiersHaveTheSamePublicResponse()
    {
        var existing = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.1");
        var unknown = await _service.RequestOtpAsync(
            _tenantA.Slug,
            "001-0000000-0",
            "192.0.2.1");

        Assert.Equal(existing.Message, unknown.Message);
        Assert.Equal(existing.ExpiresInSeconds, unknown.ExpiresInSeconds);
        Assert.NotEqual(Guid.Empty, existing.ChallengeId);
        Assert.NotEqual(Guid.Empty, unknown.ChallengeId);
        Assert.Single(_queue.Deliveries);
    }

    [Fact]
    public async Task OtpIsBoundToTheCorrectTenantAndClient()
    {
        var request = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.10");
        var code = Assert.Single(_queue.Deliveries).Code;

        var crossedTenant = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantB.Slug,
            _clientB.Cedula,
            code,
            "192.0.2.10");
        var correctTenant = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            code,
            "192.0.2.10");

        Assert.Null(crossedTenant);
        Assert.NotNull(correctTenant);
        Assert.Equal(_clientA.Id, correctTenant.ClientId);
        Assert.Single(await _context.ClientSessions.ToListAsync());
    }

    [Fact]
    public async Task TooManyWrongCodesLockTheChallenge()
    {
        var request = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.20");
        var correctCode = Assert.Single(_queue.Deliveries).Code;

        for (var attempt = 0; attempt < _options.MaximumVerificationAttempts; attempt++)
        {
            var result = await _service.VerifyOtpAsync(
                request.ChallengeId,
                _tenantA.Slug,
                _clientA.Cedula,
                "999999",
                "192.0.2.20");
            Assert.Null(result);
        }

        var lockedResult = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            correctCode,
            "192.0.2.20");
        var challenge = await _context.ClientOtpChallenges.SingleAsync(
            item => item.Id == request.ChallengeId);

        Assert.Null(lockedResult);
        Assert.True(challenge.LockedUntil > _time.GetUtcNow().UtcDateTime);
    }

    [Fact]
    public async Task ExpiredOtpCannotCreateASession()
    {
        var request = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.25");
        var code = Assert.Single(_queue.Deliveries).Code;
        _time.Advance(TimeSpan.FromMinutes(_options.OtpLifetimeMinutes + 1));

        var result = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            code,
            "192.0.2.25");

        Assert.Null(result);
        Assert.Empty(await _context.ClientSessions.ToListAsync());
    }

    [Fact]
    public async Task RequestWindowSuppressesOtpFlooding()
    {
        _options.RequestLimitPerWindow = 2;
        RecreateService();

        await _service.RequestOtpAsync(_tenantA.Slug, _clientA.Cedula, "192.0.2.30");
        _time.Advance(TimeSpan.FromSeconds(1));
        await _service.RequestOtpAsync(_tenantA.Slug, _clientA.Cedula, "192.0.2.30");
        _time.Advance(TimeSpan.FromSeconds(1));
        await _service.RequestOtpAsync(_tenantA.Slug, _clientA.Cedula, "192.0.2.30");

        Assert.Equal(2, _queue.Deliveries.Count);
        Assert.Equal(2, await _context.ClientOtpChallenges.CountAsync());
    }

    [Fact]
    public async Task RequestingAReplacementCodeRevokesThePreviousChallengeAndAuditsRecovery()
    {
        var firstRequest = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.35");
        var firstCode = Assert.Single(_queue.Deliveries).Code;
        _time.Advance(TimeSpan.FromSeconds(1));

        var replacementRequest = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.35");
        var replacementCode = _queue.Deliveries.Last().Code;

        var revokedResult = await _service.VerifyOtpAsync(
            firstRequest.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            firstCode,
            "192.0.2.35");
        var replacementResult = await _service.VerifyOtpAsync(
            replacementRequest.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            replacementCode,
            "192.0.2.35");

        Assert.Null(revokedResult);
        Assert.NotNull(replacementResult);
        Assert.Contains(
            await _context.ClientAuthenticationEvents.Select(item => item.EventType).ToListAsync(),
            eventType => eventType == "AccessRecovery");
    }

    [Fact]
    public async Task OtpCanBeUsedOnceAndTheSessionCanBeRevoked()
    {
        var request = await _service.RequestOtpAsync(
            _tenantA.Slug,
            _clientA.Cedula,
            "192.0.2.40");
        var code = Assert.Single(_queue.Deliveries).Code;

        var authenticated = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            code,
            "192.0.2.40");
        var reused = await _service.VerifyOtpAsync(
            request.ChallengeId,
            _tenantA.Slug,
            _clientA.Cedula,
            code,
            "192.0.2.40");

        Assert.NotNull(authenticated);
        Assert.Null(reused);

        var session = await _context.ClientSessions.SingleAsync();
        await _service.RevokeSessionAsync(
            session.Id,
            session.TenantId,
            session.ClientId,
            "192.0.2.40");
        await _context.Entry(session).ReloadAsync();

        Assert.NotNull(session.RevokedAt);
        Assert.Contains(
            await _context.ClientAuthenticationEvents.Select(item => item.EventType).ToListAsync(),
            eventType => eventType == "SessionRevoked");
    }

    private void RecreateService()
    {
        _service = new ClientAuthenticationService(
            _context,
            _queue,
            new FakeJwtService(),
            Options.Create(_options),
            _time,
            NullLogger<ClientAuthenticationService>.Instance);
    }

    private static Client CreateClient(Guid tenantId, string email) => new()
    {
        Id = Guid.NewGuid(),
        TenantId = tenantId,
        Nombre = email,
        Cedula = "001-1234567-8",
        Email = email,
        Telefono = "8095550101",
        FechaNacimiento = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        EstadoCivil = EstadoCivil.Soltero,
        Estado = EstadoCliente.Activo,
        FechaRegistro = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    };

    private sealed class CapturingOtpQueue : IClientOtpDeliveryQueue
    {
        public List<ClientOtpDelivery> Deliveries { get; } = [];

        public bool TryQueue(ClientOtpDelivery delivery)
        {
            Deliveries.Add(delivery);
            return true;
        }
    }

    private sealed class FakeJwtService : IJwtService
    {
        public string GenerateAccessToken(
            User user,
            Guid? collectorId = null,
            DateTime? passwordAuthenticatedAt = null) => "staff-token";

        public string GenerateClientAccessToken(Client client, Guid sessionId, DateTime expiresAt) =>
            $"client-token-{sessionId:N}";

        public string GenerateRefreshToken() => "refresh-token";
    }

    private sealed class TestTimeProvider : TimeProvider
    {
        private DateTimeOffset _utcNow;

        public TestTimeProvider(DateTimeOffset utcNow)
        {
            _utcNow = utcNow;
        }

        public override DateTimeOffset GetUtcNow() => _utcNow;

        public void Advance(TimeSpan duration)
        {
            _utcNow = _utcNow.Add(duration);
        }
    }
}
