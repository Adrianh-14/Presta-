namespace PréstamoPlus.Domain.Entities.Tenancy
{
    public class Subscription
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string PlanId { get; set; } = "basic";
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;
    }

    public enum SubscriptionStatus
    {
        Active = 0,
        Trialing = 1,
        PastDue = 2,
        Cancelled = 3
    }
}
