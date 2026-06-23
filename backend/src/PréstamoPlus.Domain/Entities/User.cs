using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Role { get; set; } = "Client";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        public Tenancy.Tenant Tenant { get; set; } = null!;
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
