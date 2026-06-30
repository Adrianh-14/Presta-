using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PréstamoPlus.API.DependencyInjection;
using PréstamoPlus.API.Middleware;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Application.Common.MultiTenancy;
using PréstamoPlus.Infrastructure.DependencyInjection;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Services;
using PréstamoPlus.Infrastructure.Persistence.SeedData;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024;
    options.ConfigureEndpointDefaults(o => o.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1AndHttp2);
});

builder.WebHost.UseUrls(FindAvailableUrls());

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

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITenantService, TenantService>();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi();
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
            var innerMsg = exception?.InnerException?.Message ?? exception?.Message ?? "Error interno del servidor";
            await context.Response.WriteAsJsonAsync(new { message = innerMsg, detail = exception?.Message });
        }
    });
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    logger.LogInformation("Aplicando migraciones...");
    await db.Database.MigrateAsync();

    logger.LogInformation("Ejecutando seed de datos...");
    await ApplicationDbContextSeed.SeedAsync(db);
    logger.LogInformation("Seed completado. Usuarios en BD: {count}", await db.Users.CountAsync());
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string[] FindAvailableUrls()
{
    for (int port = 5001; port <= 5020; port++)
    {
        try
        {
            using var socket = new System.Net.Sockets.Socket(
                System.Net.Sockets.AddressFamily.InterNetwork,
                System.Net.Sockets.SocketType.Stream,
                System.Net.Sockets.ProtocolType.Tcp);
            socket.Bind(new System.Net.IPEndPoint(System.Net.IPAddress.Loopback, port));

            var portFile = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", ".api-port");
            File.WriteAllText(portFile, port.ToString());
            Console.WriteLine($">>> API puerto HTTPS: {port} (guardado en .api-port) <<<");
            return [$"https://localhost:{port}", $"http://localhost:{port + 1}"];
        }
        catch
        {
        }
    }

    Console.WriteLine("No se encontró puerto libre en 5001-5020.");
    return ["https://localhost:5000", "http://localhost:5001"];
}
