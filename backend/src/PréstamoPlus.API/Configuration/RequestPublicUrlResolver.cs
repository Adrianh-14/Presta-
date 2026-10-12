using Microsoft.AspNetCore.Http;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.API.Configuration;

public sealed class RequestPublicUrlResolver : IPublicUrlResolver
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public RequestPublicUrlResolver(
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public string ClientPortalUrl
    {
        get
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request is not null)
            {
                var forwardedHost = request.Headers["X-Forwarded-Host"].FirstOrDefault();
                var host = (forwardedHost ?? request.Host.Value)
                    ?.Split(',', StringSplitOptions.TrimEntries)
                    .FirstOrDefault();
                var forwardedProto = request.Headers["X-Forwarded-Proto"].FirstOrDefault();
                var scheme = (forwardedProto ?? request.Scheme)
                    .Split(',', StringSplitOptions.TrimEntries)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(host) &&
                    (string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)) &&
                    Uri.TryCreate($"{scheme}://{host}", UriKind.Absolute, out var publicOrigin))
                {
                    return $"{publicOrigin.GetLeftPart(UriPartial.Authority)}/portal/login";
                }
            }

            return _configuration["Resend:ClientPortalUrl"] ?? string.Empty;
        }
    }
}
