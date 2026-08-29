using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class ClientOtpDeliveryWorker : BackgroundService
{
    private readonly ClientOtpDeliveryQueue _queue;
    private readonly IClientOtpSender _sender;
    private readonly ILogger<ClientOtpDeliveryWorker> _logger;

    public ClientOtpDeliveryWorker(
        ClientOtpDeliveryQueue queue,
        IClientOtpSender sender,
        ILogger<ClientOtpDeliveryWorker> logger)
    {
        _queue = queue;
        _sender = sender;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var delivery in _queue.ReadAllAsync(stoppingToken))
        {
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    await _sender.SendAsync(delivery, stoppingToken);
                    break;
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception) when (attempt < 3)
                {
                    _logger.LogWarning(
                        exception,
                        "Falló una entrega OTP. Reintento {Attempt} de 3.",
                        attempt + 1);
                    await Task.Delay(TimeSpan.FromSeconds(attempt * attempt), stoppingToken);
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Falló definitivamente una entrega OTP después de 3 intentos.");
                }
            }
        }
    }
}
