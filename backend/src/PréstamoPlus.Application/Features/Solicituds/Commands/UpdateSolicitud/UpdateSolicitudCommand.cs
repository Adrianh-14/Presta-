using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.UpdateSolicitud
{
    public record UpdateSolicitudCommand(Guid Id, EstadoSolicitud Estado, DateTime? FechaInicio = null) : IRequest<LoanApplicationDto?>;
}
