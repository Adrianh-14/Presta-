using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Domain.Entities
{
    public class MessageLog
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public TipoNotificacion Tipo { get; set; }
        public string Para { get; set; } = null!;
        public string Asunto { get; set; } = null!;
        public string Mensaje { get; set; } = null!;
        public EstadoMensaje Estado { get; set; } = EstadoMensaje.Pendiente;
        public DateTime? EnviadoEn { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
