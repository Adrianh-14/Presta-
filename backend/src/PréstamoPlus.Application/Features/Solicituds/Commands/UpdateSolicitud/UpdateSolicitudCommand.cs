using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.UpdateSolicitud
{
    public record UpdateSolicitudCommand(
        Guid Id,
        EstadoSolicitud Estado,
        Guid? ActorUserId = null,
        DateTime? FechaInicio = null,
        DateTime? FechaPrimerPago = null,
        string? Instrucciones = null,
        decimal? MontoAprobado = null,
        decimal? TasaInteresMensual = null,
        decimal? GastoCierrePorcentaje = null,
        int? Plazo = null,
        UnidadPlazo? UnidadPlazo = null,
        FrecuenciaPago? FrecuenciaPago = null) : IRequest<LoanApplicationDto?>;
}
