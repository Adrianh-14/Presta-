using MediatR;
using PréstamoPlus.Application.DTOs;

namespace PréstamoPlus.Application.Features.Solicituds.Queries.GetAllSolicituds
{
    public record GetAllSolicitudsQuery(Guid TenantId) : IRequest<IReadOnlyList<LoanApplicationDto>>;
}
