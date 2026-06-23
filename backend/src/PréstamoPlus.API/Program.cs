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
