using System.Security.Cryptography;
using System.Text;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common;

public static class AuditLogHasher
{
    public static string Compute(AuditLog entry)
    {
        var canonical = $"{entry.TenantId:N}|{entry.ActorUserId:N}|{entry.Action}|{entry.EntityType}|{entry.EntityId:N}|{entry.MetadataJson}|{entry.CreatedAt:O}|{entry.PreviousHash}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
    }
}
