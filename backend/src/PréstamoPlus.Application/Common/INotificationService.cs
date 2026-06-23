namespace PréstamoPlus.Application.Common
{
    public interface INotificationService
    {
        Task SendWhatsAppAsync(string to, string message);
        Task SendEmailAsync(string to, string subject, string body);
    }
}
