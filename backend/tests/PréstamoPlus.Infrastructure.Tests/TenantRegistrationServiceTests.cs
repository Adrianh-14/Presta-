using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Services;
using Xunit;

namespace PréstamoPlus.Infrastructure.Tests;

public sealed class TenantRegistrationServiceTests
{
    [Fact]
    public async Task RegistrationCreatesIsolatedTrialAndAdministratorAtomically()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var db = new ApplicationDbContext(options);
        await db.Database.EnsureCreatedAsync();
        var service = CreateService(db);

        var result = await service.RegisterAsync(new TenantRegistrationRequest
        {
            BusinessName = "Financiera Horizonte",
            OwnerName = "Ana Mejía",
            Email = "ANA@HORIZONTE.DO",
            Password = "Clave-Segura-2026!",
            Rnc = "101010101",
            Phone = "809-555-0101",
            AcceptTerms = true
        });

        var tenant = await db.Tenants.Include(item => item.Subscription).SingleAsync();
        Assert.Equal("financiera-horizonte", tenant.Slug);
        Assert.Equal(SubscriptionStatus.Trialing, tenant.Subscription!.Status);
        Assert.True(tenant.Subscription.TrialEndsAt > DateTime.UtcNow.AddDays(13));
        Assert.Equal(SystemRoles.Admin, (await db.Users.SingleAsync()).Role);
        Assert.Equal(tenant.Id, result.User.TenantId);
        Assert.Equal(1, await db.TenantConfigs.CountAsync());
        Assert.Equal(1, await db.RefreshTokens.CountAsync());
    }

    [Fact]
    public void PasswordHasherSupportsNewHashesAndRejectsWrongPassword()
    {
        var passwords = new PasswordService();
        var encoded = passwords.Hash("Clave-Segura-2026!");

        Assert.StartsWith("v1$210000$", encoded);
        Assert.True(passwords.Verify("Clave-Segura-2026!", encoded));
        Assert.False(passwords.Verify("otra-clave", encoded));
        Assert.False(passwords.Verify("Clave-Segura-2026!", "hash-invalido"));
    }

    private static TenantRegistrationService CreateService(ApplicationDbContext db) =>
        new(
            db,
            new PasswordService(),
            new FakeJwtService(),
            Options.Create(new JwtSettings
            {
                AccessTokenExpirationMinutes = 60,
                RefreshTokenExpirationDays = 7
            }));

    private sealed class FakeJwtService : IJwtService
    {
        public string GenerateAccessToken(User user, Guid? collectorId = null, DateTime? passwordAuthenticatedAt = null) => "access-token";
        public string GenerateClientAccessToken(Client client, Guid sessionId, DateTime expiresAt) => "client-token";
        public string GenerateRefreshToken() => $"refresh-{Guid.NewGuid():N}";
    }
}
