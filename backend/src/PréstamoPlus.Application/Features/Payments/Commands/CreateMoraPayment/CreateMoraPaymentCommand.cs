using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Payments.Commands.CreateMoraPayment
{
    public record CreateMoraPaymentCommand(CreateMoraPaymentRequest Request) : IRequest<PaymentDto>;
}
