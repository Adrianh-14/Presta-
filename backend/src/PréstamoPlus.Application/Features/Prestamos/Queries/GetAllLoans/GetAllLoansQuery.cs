using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Prestamos.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans
{
    public record GetAllLoansQuery(string? Search = null, string? Estado = null, string? Tipo = null) : IRequest<IReadOnlyList<LoanDto>>;

    public class GetAllLoansQueryHandler : IRequestHandler<GetAllLoansQuery, IReadOnlyList<LoanDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllLoansQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<LoanDto>> Handle(GetAllLoansQuery request, CancellationToken cancellationToken)
        {
            var spec = new AllLoansWithClientSpec(request.Search);
            var loans = await _unitOfWork.Loans.ListAsync(spec, cancellationToken);

            return loans.Select(l => new LoanDto
            {
                Id = l.Id,
                ClientId = l.ClientId,
                Cliente = l.Client.Nombre,
                Cedula = l.Client.Cedula,
                Telefono = l.Client.Telefono,
                Email = l.Client.Email,
                Monto = l.MontoOriginal,
                Tasa = l.TasaInteresAnual,
                Plazo = l.PlazoMeses,
                CuotaMensual = l.CuotaMensual,
                SaldoPendiente = l.SaldoPendiente,
                Estado = l.Estado,
                Tipo = l.Tipo,
                FrecuenciaPago = l.FrecuenciaPago,
                FechaInicio = l.FechaInicio,
                FechaVencimiento = l.FechaVencimiento
            }).ToList();
        }
    }
}
