namespace PréstamoPlus.Application.Common
{
    public class ResendSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = "Bonexa";
        public string ReplyToEmail { get; set; } = string.Empty;
        public string ClientPortalUrl { get; set; } = "http://localhost:5173/portal/login";
    }
}
