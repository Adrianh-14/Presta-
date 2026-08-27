namespace PréstamoPlus.Application.Common
{
    public class ResendSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string FromEmail { get; set; } = "onboarding@resend.dev";
        public string FromName { get; set; } = "PrestamoPlus";
        public string ClientPortalUrl { get; set; } = "http://localhost:5173/portal/login";
    }
}
