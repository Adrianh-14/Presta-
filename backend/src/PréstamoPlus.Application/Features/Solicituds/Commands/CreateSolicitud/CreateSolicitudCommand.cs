using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.CreateSolicitud
{
    public record CreateSolicitudCommand(CreateSolicitudRequest Request) : IRequest<LoanApplicationDto>;
}
