namespace PréstamoPlus.Application.Common
{
    public record EmailAttachment(string FileName, byte[] Content);

    public interface INotificationService
    {
        bool EmailEnabled { get; }
        string ClientPortalUrl { get; }
        Task SendWhatsAppAsync(string to, string message);
        Task SendEmailAsync(
            string to,
            string subject,
            string body,
            IReadOnlyCollection<EmailAttachment>? attachments = null);
    }
}
