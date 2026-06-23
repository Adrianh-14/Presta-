using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Payments.Commands.CreatePayment
{
    public record CreatePaymentCommand(CreatePaymentRequest Request) : IRequest<PaymentDto>;
}
