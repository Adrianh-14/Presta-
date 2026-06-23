using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PréstamoPlus.Application.Common.MultiTenancy;

namespace PréstamoPlus.API.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
        {
            var tenantIdClaim = context.User?.FindFirst("tenantId")?.Value;

            if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                tenantService.SetCurrentTenantId(tenantId);
            }

            await _next(context);
        }
    }
}
