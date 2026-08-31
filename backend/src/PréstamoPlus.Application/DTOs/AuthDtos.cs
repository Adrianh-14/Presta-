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
        public string? NombreEmpresa { get; init; }
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

    public record TenantRegistrationRequest
    {
        public string BusinessName { get; init; } = string.Empty;
        public string OwnerName { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public string? Rnc { get; init; }
        public string? Phone { get; init; }
        public decimal InitialCapital { get; init; }
        public decimal InitialCapitalUsd { get; init; }
        public decimal InitialCapitalEur { get; init; }
        public List<string> EnabledCurrencies { get; init; } = new() { "DOP" };
        public Dictionary<string, decimal> InitialCapitalByCurrency { get; init; } = new();
        public string? CompanyType { get; init; }
        public string? EconomicActivity { get; init; }
        public string? Address { get; init; }
        public string? City { get; init; }
        public string? Province { get; init; }
        public string? Country { get; init; }
        public string? Website { get; init; }
        public int? EmployeeCount { get; init; }
        public string? RepresentativeIdType { get; init; }
        public string? RepresentativeIdNumber { get; init; }
        public string? RepresentativeIdPhoto { get; init; }
        public string? RepresentativePhoto { get; init; }
        public bool AcceptTerms { get; init; }
    }

    public record RefreshTokenRequest
    {
        public string RefreshToken { get; init; } = string.Empty;
    }

    public record PasswordResetRequest { public string Email { get; init; } = string.Empty; }
    public record PasswordResetConfirmRequest { public string Token { get; init; } = string.Empty; public string NewPassword { get; init; } = string.Empty; }
}
