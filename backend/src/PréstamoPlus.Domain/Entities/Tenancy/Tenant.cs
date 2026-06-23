namespace PréstamoPlus.Domain.Entities.Tenancy
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? RNC { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? OnboardingCompletedAt { get; set; }

        public Subscription? Subscription { get; set; }
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
