using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using Xunit;

namespace PréstamoPlus.Infrastructure.Tests;

public sealed class AuditLogTests
{
    [Fact]
    public void HashIsDeterministicForTheCanonicalEntry()
    {
        var entry = new AuditLog
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            ActorUserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Action = "payment.created", EntityType = "Loan",
            EntityId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            MetadataJson = "{\"amount\":100}",
            CreatedAt = DateTime.Parse("2026-01-01T00:00:00.0000000Z").ToUniversalTime(),
            PreviousHash = "previous"
        };

        var originalHash = AuditLogHasher.Compute(entry);
        Assert.Equal(originalHash, AuditLogHasher.Compute(entry));
        entry.MetadataJson = "{\"amount\":101}";
        Assert.NotEqual(originalHash, AuditLogHasher.Compute(entry));
    }
}
