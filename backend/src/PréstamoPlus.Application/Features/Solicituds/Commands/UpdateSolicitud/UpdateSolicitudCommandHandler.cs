using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Application.Features.Solicituds.Specifications;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.UpdateSolicitud
{
    public class UpdateSolicitudCommandHandler : IRequestHandler<UpdateSolicitudCommand, LoanApplicationDto?>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateSolicitudCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoanApplicationDto?> Handle(UpdateSolicitudCommand request, CancellationToken cancellationToken)
        {
            var spec = new LoanApplicationByIdWithClientSpec(request.Id);
            var loanApp = await _unitOfWork.LoanApplications.FirstOrDefaultAsync(spec, cancellationToken);
            if (loanApp is null) return null;

            loanApp.Estado = request.Estado;
            await _unitOfWork.LoanApplications.UpdateAsync(loanApp, cancellationToken);

            if (request.Estado == EstadoSolicitud.Aprobada)
            {
                var fechaInicio = request.FechaInicio ?? DateTime.UtcNow;
                var plazoMeses = loanApp.UnidadPlazo == UnidadPlazo.Anios
                    ? loanApp.Plazo * 12
                    : loanApp.Plazo;

                var loan = new Loan
                {
                    Id = Guid.NewGuid(),
                    TenantId = loanApp.TenantId,
                    ClientId = loanApp.ClientId,
                    LoanApplicationId = loanApp.Id,
                    MontoOriginal = loanApp.MontoSolicitado,
                    TasaInteresAnual = loanApp.TasaInteresMensual * 12,
                    PlazoMeses = plazoMeses,
                    CuotaMensual = loanApp.CuotaEstimada,
                    SaldoPendiente = loanApp.TotalPagar,
                    Estado = EstadoPrestamo.Activo,
                    Tipo = loanApp.TipoPrestamo,
                    FrecuenciaPago = loanApp.FrecuenciaPago,
                    FechaInicio = fechaInicio,
                    FechaVencimiento = fechaInicio.AddMonths(plazoMeses),
                    CreatedAt = DateTime.UtcNow
                };
                await _unitOfWork.Loans.AddAsync(loan, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new LoanApplicationDto
            {
                Id = loanApp.Id,
                MontoSolicitado = loanApp.MontoSolicitado,
                TasaInteresMensual = loanApp.TasaInteresMensual,
                Plazo = loanApp.Plazo,
                UnidadPlazo = loanApp.UnidadPlazo,
                FrecuenciaPago = loanApp.FrecuenciaPago,
                GastoCierrePorcentaje = loanApp.GastoCierrePorcentaje,
                CuotaEstimada = loanApp.CuotaEstimada,
                TotalPagar = loanApp.TotalPagar,
                TotalIntereses = loanApp.TotalIntereses,
                Estado = loanApp.Estado,
                FechaSolicitud = loanApp.FechaSolicitud,
                Client = new ClientDto
                {
                    Id = loanApp.Client.Id,
                    Nombre = loanApp.Client.Nombre,
                    Cedula = loanApp.Client.Cedula,
                    Email = loanApp.Client.Email,
                    Telefono = loanApp.Client.Telefono,
                    FechaNacimiento = loanApp.Client.FechaNacimiento,
                    EstadoCivil = loanApp.Client.EstadoCivil
                }
            };
        }
    }
}
