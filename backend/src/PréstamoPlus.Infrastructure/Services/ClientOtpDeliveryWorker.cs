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
            try
            {
                await _sender.SendAsync(delivery, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Falló una entrega OTP de cliente.");
            }
        }
    }
}
