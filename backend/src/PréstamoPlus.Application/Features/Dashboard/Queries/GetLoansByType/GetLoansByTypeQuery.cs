using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Dashboard.Queries.GetLoansByType
{
    public record GetLoansByTypeQuery(Guid? TenantId = null) : IRequest<IReadOnlyList<LoansByTypeDto>>;

    public class GetLoansByTypeQueryHandler : IRequestHandler<GetLoansByTypeQuery, IReadOnlyList<LoansByTypeDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetLoansByTypeQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<LoansByTypeDto>> Handle(GetLoansByTypeQuery request, CancellationToken cancellationToken)
        {
            var loans = await _unitOfWork.Loans.ListAsync(cancellationToken);
            if (request.TenantId.HasValue && request.TenantId.Value != Guid.Empty)
                loans = loans.Where(l => l.TenantId == request.TenantId.Value).ToList();

            return loans
                .GroupBy(l => l.Tipo)
                .Select(g => new LoansByTypeDto
                {
                    Nombre = g.Key == Domain.Enums.TipoPrestamo.Personal ? "Personal" : "Garantía",
                    Valor = g.Sum(l => l.MontoOriginal)
                })
                .ToList();
        }
    }
}
