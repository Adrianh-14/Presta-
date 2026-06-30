using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Prestamos.Commands.UpdateLoanStatus
{
    public record UpdateLoanStatusCommand(Guid Id, EstadoPrestamo Estado) : IRequest<LoanDto?>;

    public class UpdateLoanStatusCommandHandler : IRequestHandler<UpdateLoanStatusCommand, LoanDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateLoanStatusCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanDto?> Handle(UpdateLoanStatusCommand request, CancellationToken cancellationToken)
        {
            var loan = await _unitOfWork.Loans.GetByIdAsync(request.Id);
            if (loan is null) return null;

            loan.Estado = request.Estado;
            if (request.Estado == Domain.Enums.EstadoPrestamo.Cancelado || request.Estado == Domain.Enums.EstadoPrestamo.Pagado)
            {
                loan.SaldoPendiente = 0;
            }
            await _unitOfWork.Loans.UpdateAsync(loan, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);

            return new LoanDto
            {
                Id = loan.Id,
                ClientId = loan.ClientId,
                Cliente = client?.Nombre ?? string.Empty,
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
