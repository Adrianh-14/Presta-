using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Prestamos.Specifications;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Queries.GetAllLoans
{
    public record GetAllLoansQuery(string? Search = null, string? Estado = null, string? Tipo = null, Guid? TenantId = null) : IRequest<IReadOnlyList<LoanDto>>;

    public class GetAllLoansQueryHandler : IRequestHandler<GetAllLoansQuery, IReadOnlyList<LoanDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetAllLoansQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<LoanDto>> Handle(GetAllLoansQuery request, CancellationToken cancellationToken)
        {
            var spec = new AllLoansWithClientSpec(request.Search, request.TenantId);
            var loans = await _unitOfWork.Loans.ListAsync(spec, cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.Estado) &&
                Enum.TryParse<EstadoPrestamo>(request.Estado, true, out var estado))
                loans = loans.Where(l => l.Estado == estado).ToList();

            if (!string.IsNullOrWhiteSpace(request.Tipo) &&
                Enum.TryParse<TipoPrestamo>(request.Tipo, true, out var tipo))
                loans = loans.Where(l => l.Tipo == tipo).ToList();

            return loans.Select(l => new LoanDto
            {
                Id = l.Id,
                TenantId = l.TenantId,
                ClientId = l.ClientId,
                Cliente = l.Client.Nombre,
                Cedula = l.Client.Cedula,
                Telefono = l.Client.Telefono,
                Email = l.Client.Email,
                Monto = l.MontoOriginal,
                Moneda = l.Moneda,
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
