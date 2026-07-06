using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Application.Features.Prestamos.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Queries.GetLoanById
{
    public record GetLoanByIdQuery(Guid Id) : IRequest<LoanDto?>;

    public class GetLoanByIdQueryHandler : IRequestHandler<GetLoanByIdQuery, LoanDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetLoanByIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanDto?> Handle(GetLoanByIdQuery request, CancellationToken cancellationToken)
        {
            var spec = new LoanByIdWithClientSpec(request.Id);
            var loan = await _unitOfWork.Loans.FirstOrDefaultAsync(spec, cancellationToken);
            if (loan is null) return null;

            return new LoanDto
            {
                Id = loan.Id,
                ClientId = loan.ClientId,
                Cliente = loan.Client.Nombre,
                Cedula = loan.Client.Cedula,
                Telefono = loan.Client.Telefono,
                Email = loan.Client.Email,
                Monto = loan.MontoOriginal,
                Tasa = loan.TasaInteresAnual,
                Plazo = loan.PlazoMeses,
                CuotaMensual = loan.CuotaMensual,
                SaldoPendiente = loan.SaldoPendiente,
                Estado = loan.Estado,
                Tipo = loan.Tipo,
                FrecuenciaPago = loan.FrecuenciaPago,
                FechaInicio = loan.FechaInicio,
                FechaVencimiento = loan.FechaVencimiento
            };
        }
    }
}
