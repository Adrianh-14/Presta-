namespace PréstamoPlus.Domain.Entities.Tenancy;
public sealed class PlatformPromotion
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
    public bool AppliesToNewTenants { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string Label { get; set; } = "Cortesía de plataforma";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
