[CmdletBinding()]
param(
    [string]$PostgresDatabase = "prestamoplus",
    [string]$PostgresUser = "prestamoplus"
)

$ErrorActionPreference = "Stop"

if ($PostgresDatabase -notmatch '^[A-Za-z][A-Za-z0-9_]*$' -or
    $PostgresUser -notmatch '^[A-Za-z][A-Za-z0-9_]*$') {
    throw "El nombre de la base de datos y el usuario solo pueden contener letras, números y guion bajo."
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$apiProject = Join-Path $repositoryRoot "backend/src/PréstamoPlus.API/PréstamoPlus.API.csproj"
$envPath = Join-Path $repositoryRoot ".env"

$postgresPassword = [Convert]::ToBase64String(
    [Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
$jwtSecret = [Convert]::ToBase64String(
    [Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$otpPepper = [Convert]::ToBase64String(
    [Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

$preservedLines = if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | Where-Object {
        $_ -notmatch '^\s*POSTGRES_(DB|USER|PASSWORD)\s*='
    }
} else {
    @()
}

$newEnvironment = @(
    $preservedLines
    "POSTGRES_DB=$PostgresDatabase"
    "POSTGRES_USER=$PostgresUser"
    "POSTGRES_PASSWORD=$postgresPassword"
)
$newEnvironment | Set-Content -LiteralPath $envPath -Encoding utf8

$connectionString = "Host=localhost;Port=5433;Database=$PostgresDatabase;Username=$PostgresUser;Password=$postgresPassword"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" $connectionString --project $apiProject | Out-Null
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret --project $apiProject | Out-Null
dotnet user-secrets set "ClientAuthentication:OtpPepper" $otpPepper --project $apiProject | Out-Null
dotnet user-secrets set "DemoData:Enabled" "false" --project $apiProject | Out-Null

$runningDatabase = docker compose --project-directory $repositoryRoot ps --status running --services 2>$null
if ($runningDatabase -contains "postgres") {
    $escapedPassword = $postgresPassword.Replace("'", "''")
    "ALTER ROLE `"$PostgresUser`" WITH PASSWORD '$escapedPassword';" |
        docker compose --project-directory $repositoryRoot exec -T postgres `
            psql -v ON_ERROR_STOP=1 -U $PostgresUser -d $PostgresDatabase | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo rotar la contraseña del rol de PostgreSQL."
    }
}

Write-Host "Secretos locales generados, almacenados fuera de Git y configurados para la API."
Write-Host "Los valores no se imprimieron. DemoData permanece deshabilitado."
