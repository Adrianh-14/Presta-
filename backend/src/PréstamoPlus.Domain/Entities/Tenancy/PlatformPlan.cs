namespace PréstamoPlus.Domain.Entities.Tenancy;

public sealed class PlatformPlan
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal PrecioMensual { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
