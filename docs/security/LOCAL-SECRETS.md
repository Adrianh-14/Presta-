# Configuración local sin secretos versionados

Desde PowerShell, en la raíz del repositorio:

```powershell
.\scripts\Initialize-LocalSecrets.ps1
```

El inicializador genera valores aleatorios, conserva otras variables existentes en `.env`, configura los secretos de la API mediante .NET User Secrets y rota el rol de PostgreSQL si el contenedor está activo. No imprime los valores.

También genera `ClientAuthentication:OtpPepper`. Para entregar códigos OTP por correo configura Resend fuera de Git:

```powershell
dotnet user-secrets set "Resend:ApiKey" "<valor>" --project backend/src/PréstamoPlus.API
dotnet user-secrets set "Resend:FromEmail" "acceso@tu-dominio.com" --project backend/src/PréstamoPlus.API
```

Los datos demo quedan deshabilitados. Para habilitarlos conscientemente en desarrollo, define mediante User Secrets un `DemoData:Password` fuerte y cambia `DemoData:Enabled` a `true`. El validador impide habilitar seeds fuera de `Development`.

En producción configura como secretos protegidos:

- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `ClientAuthentication__OtpPepper`
- `Security__RealDataApproved`
- `Security__ReleaseApprovalReference`
- `Resend__ApiKey`, cuando se habilite correo

Nunca copies valores productivos a `appsettings*.json`, `.env.example`, capturas, tickets o logs.
