using System.Threading.Channels;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.Services;

public sealed class ClientOtpDeliveryQueue : IClientOtpDeliveryQueue
{
    private readonly Channel<ClientOtpDelivery> _channel = Channel.CreateBounded<ClientOtpDelivery>(
        new BoundedChannelOptions(256)
        {
            SingleReader = true,
            SingleWriter = false,
            FullMode = BoundedChannelFullMode.DropWrite
        });

    public bool TryQueue(ClientOtpDelivery delivery) => _channel.Writer.TryWrite(delivery);

    public IAsyncEnumerable<ClientOtpDelivery> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
