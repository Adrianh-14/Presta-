using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;
using PréstamoPlus.API.DependencyInjection;
using PréstamoPlus.API.Middleware;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Common.MultiTenancy;
using PréstamoPlus.Infrastructure.DependencyInjection;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Services;
using PréstamoPlus.Infrastructure.Persistence.SeedData;
using PréstamoPlus.API.Configuration;
using PréstamoPlus.API.Health;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

if (builder.Environment.IsDevelopment())
{
    var keyDirectory = new DirectoryInfo(Path.Combine(Path.GetTempPath(), "prestamoplus-dataprotection-keys"));
    keyDirectory.Create();
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(keyDirectory)
        .SetApplicationName("PrestamoPlus");
}

SecurityConfigurationValidator.Validate(builder.Configuration, builder.Environment);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 70 * 1024 * 1024;
    options.ConfigureEndpointDefaults(o => o.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1AndHttp2);
});

if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls(FindAvailableDevelopmentUrls());
}

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddPrestamoPlusAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Has alcanzado el límite temporal de intentos. Espera antes de volver a intentarlo.",
            code = "RATE_LIMITED"
        }, cancellationToken);
    };
    options.AddPolicy("client-otp-request", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRemoteAddress(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
    options.AddPolicy("client-otp-verify", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRemoteAddress(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
    options.AddPolicy("tenant-registration", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRemoteAddress(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
    options.AddPolicy("public-form", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRemoteAddress(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
});
builder.Services.AddScoped<ITenantService, TenantService>();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: new[] { "ready" });
builder.Services.AddApplicationDecorators();
builder.Services.AddHostedService<LoanManagementService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(error =>
{
    error.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception");

        context.Response.ContentType = "application/json";

        if (exception is FluentValidation.ValidationException validationEx)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            var errors = validationEx.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage });
            await context.Response.WriteAsJsonAsync(new { message = "Error de validación", errors });
        }
        else
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Ocurrió un error interno. Intenta nuevamente más tarde."
            });
        }
    });
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    logger.LogInformation("Aplicando migraciones...");
    await db.Database.MigrateAsync();

    // Algunas bases antiguas pueden tener la migración registrada aunque las tablas
    // no existan físicamente. La reparación es idempotente y conserva los datos.
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""PlatformPlans""
        (
            ""Id"" uuid NOT NULL,
            ""Code"" character varying(40) NOT NULL,
            ""Nombre"" character varying(120) NOT NULL,
            ""PrecioMensual"" numeric NOT NULL,
            ""Descripcion"" character varying(300) NOT NULL,
            ""IsActive"" boolean NOT NULL DEFAULT true,
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT ""PK_PlatformPlans"" PRIMARY KEY (""Id"")
        );
        CREATE TABLE IF NOT EXISTS ""PlatformPromotions""
        (
            ""Id"" uuid NOT NULL,
            ""IsActive"" boolean NOT NULL,
            ""AppliesToNewTenants"" boolean NOT NULL,
            ""StartsAt"" timestamp with time zone NOT NULL,
            ""EndsAt"" timestamp with time zone NOT NULL,
            ""Label"" character varying(200) NOT NULL,
            ""UpdatedAt"" timestamp with time zone NOT NULL,
            CONSTRAINT ""PK_PlatformPromotions"" PRIMARY KEY (""Id"")
        );");
    logger.LogInformation("Reparación de tablas de plataforma completada.");

    if (builder.Configuration.GetValue<bool>("DemoData:Enabled"))
    {
        logger.LogWarning("DemoData está habilitado. Esta opción solo es válida en Development.");
        await ApplicationDbContextSeed.SeedAsync(
            db,
            builder.Configuration["DemoData:Password"]!);
        logger.LogInformation("Seed demo completado. Usuarios en BD: {count}", await db.Users.CountAsync());
    }
    else
    {
        logger.LogInformation("Seed demo deshabilitado.");
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers.TryGetValue("X-Correlation-ID", out var incoming) && Guid.TryParse(incoming, out _)
        ? incoming.ToString()
        : Guid.NewGuid().ToString("N");
    context.Response.Headers["X-Correlation-ID"] = correlationId;
    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RequestCorrelation");
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=(self)";
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Content-Security-Policy"] =
            "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; " +
            "script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; " +
            "media-src 'self' blob:; connect-src 'self'; form-action 'self'";
        context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
    }
    using (logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId, ["Path"] = context.Request.Path.ToString() }))
    {
        await next();
    }
});
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<ClientSessionMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapHealthChecks("/health/ready").AllowAnonymous();
app.MapGet("/health/live", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();

app.Run();

static string GetRemoteAddress(HttpContext context)
{
    // Nginx/ngrok forward the original client address. Use the first hop so
    // anonymous rate limits remain per client when the API sits behind a proxy.
    var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
    var originalAddress = forwardedFor?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .FirstOrDefault();

    return !string.IsNullOrWhiteSpace(originalAddress)
        ? originalAddress
        : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

static string[] FindAvailableDevelopmentUrls()
{
    for (int port = 5001; port <= 5020; port++)
    {
        if (!IsPortAvailable(port))
        {
            continue;
        }

        var repositoryRoot = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."));
        File.WriteAllText(Path.Combine(repositoryRoot, ".api-port"), port.ToString());

        Console.WriteLine($">>> API HTTP local: http://localhost:{port} <<<");

        foreach (var address in GetLocalIpv4Addresses())
        {
            Console.WriteLine($">>> API accesible en la red: http://{address}:{port} <<<");
        }

        return [$"http://0.0.0.0:{port}"];
    }

    Console.WriteLine("No se encontró puerto libre en 5001-5020.");
    return ["http://0.0.0.0:5000"];
}

static bool IsPortAvailable(int port)
{
    try
    {
        if (System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties()
            .GetActiveTcpListeners()
            .Any(endpoint => endpoint.Port == port))
        {
            return false;
        }

        using var socket = new System.Net.Sockets.Socket(
            System.Net.Sockets.AddressFamily.InterNetwork,
            System.Net.Sockets.SocketType.Stream,
            System.Net.Sockets.ProtocolType.Tcp);
        socket.ExclusiveAddressUse = true;
        socket.Bind(new System.Net.IPEndPoint(System.Net.IPAddress.Any, port));
        return true;
    }
    catch (System.Net.Sockets.SocketException)
    {
        return false;
    }
}

static IEnumerable<System.Net.IPAddress> GetLocalIpv4Addresses()
{
    try
    {
        return System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName())
            .AddressList
            .Where(address =>
                address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork &&
                !System.Net.IPAddress.IsLoopback(address))
            .Distinct()
            .ToArray();
    }
    catch (System.Net.Sockets.SocketException)
    {
        return [];
    }
}
