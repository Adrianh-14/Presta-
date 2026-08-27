using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByMonth
{
    public record GetLoansByMonthQuery(Guid? TenantId = null) : IRequest<IReadOnlyList<LoansByMonthDto>>;

    public class GetLoansByMonthQueryHandler : IRequestHandler<GetLoansByMonthQuery, IReadOnlyList<LoansByMonthDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetLoansByMonthQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<LoansByMonthDto>> Handle(GetLoansByMonthQuery request, CancellationToken cancellationToken)
        {
            var loans = await _unitOfWork.Loans.ListAsync(cancellationToken);
            if (request.TenantId.HasValue && request.TenantId.Value != Guid.Empty)
                loans = loans.Where(l => l.TenantId == request.TenantId.Value).ToList();
            var monthNames = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };

            var result = Enumerable.Range(0, 6)
                .Select(i => DateTime.UtcNow.AddMonths(-5 + i))
                .Select(date => new LoansByMonthDto
                {
                    Mes = monthNames[date.Month - 1],
                    Cantidad = loans.Count(l => l.FechaInicio.Month == date.Month && l.FechaInicio.Year == date.Year)
                })
                .ToList();

            return result;
        }
    }
}
