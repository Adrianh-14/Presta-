namespace PréstamoPlus.Application.DTOs
{
    public record AuthResponseDto
    {
        public string AccessToken { get; init; } = string.Empty;
        public string RefreshToken { get; init; } = string.Empty;
        public DateTime ExpiresAt { get; init; }
        public UserDto User { get; init; } = null!;
    }

    public record UserDto
    {
        public Guid Id { get; init; }
        public Guid? TenantId { get; init; }
        public string Email { get; init; } = string.Empty;
        public string Nombre { get; init; } = string.Empty;
        public string Role { get; init; } = string.Empty;
    }

    public record LoginRequest
    {
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
    }

    public record RegisterRequest
    {
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public string Nombre { get; init; } = string.Empty;
        public string Role { get; init; } = "Client";
    }

    public record RefreshTokenRequest
    {
        public string RefreshToken { get; init; } = string.Empty;
    }
}
