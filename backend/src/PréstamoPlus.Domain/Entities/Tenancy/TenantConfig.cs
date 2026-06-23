namespace PréstamoPlus.Domain.Entities.Tenancy
{
    public class TenantConfig
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public decimal TasaMoraDiaria { get; set; } = 0.05m;
        public int DiasGracia { get; set; } = 3;
        public string? TelefonoWhatsApp { get; set; }
        public string? EmailFrom { get; set; }

        public Tenant Tenant { get; set; } = null!;
    }
}
