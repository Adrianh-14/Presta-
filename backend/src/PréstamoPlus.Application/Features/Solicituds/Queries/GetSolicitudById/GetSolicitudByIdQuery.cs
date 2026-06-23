using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Solicituds.Queries.GetSolicitudById
{
    public record GetSolicitudByIdQuery(Guid Id) : IRequest<LoanApplicationDto?>;
}
