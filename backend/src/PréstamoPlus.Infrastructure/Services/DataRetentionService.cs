using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class DataRetentionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DataRetentionService> _logger;

    public DataRetentionService(IServiceScopeFactory scopeFactory, ILogger<DataRetentionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var now = DateTime.UtcNow;
                var otpCutoff = now.AddDays(-90);
                var logCutoff = now.AddMonths(-12);

                var otp = await db.ClientOtpChallenges.Where(x => x.CreatedAt < otpCutoff).ExecuteDeleteAsync(stoppingToken);
                var sessions = await db.ClientSessions.Where(x => x.CreatedAt < otpCutoff).ExecuteDeleteAsync(stoppingToken);
                var logs = await db.MessageLogs.Where(x => x.CreatedAt < logCutoff).ExecuteDeleteAsync(stoppingToken);
                _logger.LogInformation("Retención ejecutada: {Otp} OTP, {Sessions} sesiones y {Logs} logs eliminados.", otp, sessions, logs);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { _logger.LogError(ex, "Error durante la purga de retención."); }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
