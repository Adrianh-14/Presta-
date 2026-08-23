[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$utf8WithoutBom = [Text.UTF8Encoding]::new($false)

$settingsFiles = Get-ChildItem -LiteralPath "backend/src" -Recurse -File -Filter "appsettings*.json" -ErrorAction SilentlyContinue

foreach ($settingsFile in $settingsFiles) {
    $settings = Get-Content -LiteralPath $settingsFile.FullName -Raw | ConvertFrom-Json
    if ($null -ne $settings.ConnectionStrings -and
        $null -ne $settings.ConnectionStrings.PSObject.Properties["DefaultConnection"]) {
        $settings.ConnectionStrings.DefaultConnection = ""
    }

    if ($null -ne $settings.JwtSettings -and
        $null -ne $settings.JwtSettings.PSObject.Properties["SecretKey"]) {
        $settings.JwtSettings.SecretKey = ""
    }

    $sanitizedJson = ($settings | ConvertTo-Json -Depth 100) + [Environment]::NewLine
    [IO.File]::WriteAllText($settingsFile.FullName, $sanitizedJson, $utf8WithoutBom)
}

$composePath = "docker-compose.yml"
if (Test-Path -LiteralPath $composePath) {
    $compose = Get-Content -LiteralPath $composePath -Raw
    $compose = [regex]::Replace(
        $compose,
        '(?m)^(\s*POSTGRES_PASSWORD:\s*).+$',
        { param($match) $match.Groups[1].Value + '${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD in the ignored .env file}' })
    [IO.File]::WriteAllText((Resolve-Path -LiteralPath $composePath), $compose, $utf8WithoutBom)
}

$uploadsPath = "backend/uploads"
if (Test-Path -LiteralPath $uploadsPath) {
    Get-ChildItem -LiteralPath $uploadsPath -File -Force |
        Where-Object Name -ne ".gitkeep" |
        Remove-Item -Force
}
