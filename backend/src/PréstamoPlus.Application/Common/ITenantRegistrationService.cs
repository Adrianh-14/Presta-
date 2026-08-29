using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Common;

public interface ITenantRegistrationService
{
    Task<AuthResponseDto> RegisterAsync(
        TenantRegistrationRequest request,
        CancellationToken cancellationToken = default);
}
