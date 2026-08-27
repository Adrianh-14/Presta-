using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Cobradores.Commands.AssignLoans
{
    public record AssignLoansCommand(
        Guid CollectorId,
        AssignLoansRequest Request,
        Guid AssignedBy,
        Guid TenantId) : IRequest<List<CollectionAssignmentDto>>;

    public class AssignLoansCommandHandler : IRequestHandler<AssignLoansCommand, List<CollectionAssignmentDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public AssignLoansCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<CollectionAssignmentDto>> Handle(AssignLoansCommand request, CancellationToken cancellationToken)
        {
            var collector = await _unitOfWork.Collectors.GetByIdAsync(request.CollectorId);
            if (collector is null || collector.TenantId != request.TenantId)
                throw new InvalidOperationException("Cobrador no encontrado.");

            var allAssignments = await _unitOfWork.CollectionAssignments.ListAsync(cancellationToken);
            var existingLoanIds = allAssignments
                .Where(a => a.CollectorId == request.CollectorId)
                .Select(a => a.LoanId)
                .ToHashSet();

            var result = new List<CollectionAssignmentDto>();

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                foreach (var loanId in request.Request.LoanIds)
                {
                    if (existingLoanIds.Contains(loanId)) continue;

                    var loan = await _unitOfWork.Loans.GetByIdAsync(loanId);
                    if (loan is null || loan.TenantId != request.TenantId) continue;

                    var client = await _unitOfWork.Clients.GetByIdAsync(loan.ClientId);
                    if (client is null || client.TenantId != request.TenantId) continue;

                    var assignment = new CollectionAssignment
                    {
                        Id = Guid.NewGuid(),
                        CollectorId = request.CollectorId,
                        LoanId = loanId,
                        AssignedAt = DateTime.UtcNow,
                        AssignedBy = request.AssignedBy,
                        Estado = EstadoAsignacion.Asignado
                    };

                    await _unitOfWork.CollectionAssignments.AddAsync(assignment, cancellationToken);

                    result.Add(new CollectionAssignmentDto
                    {
                        Id = assignment.Id,
                        CollectorId = assignment.CollectorId,
                        LoanId = assignment.LoanId,
                        ClienteNombre = client.Nombre,
                        ClienteCedula = client.Cedula,
                        ClienteTelefono = client.Telefono,
                        MontoOriginal = loan.MontoOriginal,
                        CuotaMensual = loan.CuotaMensual,
                        SaldoPendiente = loan.SaldoPendiente,
                        Frecuencia = loan.FrecuenciaPago,
                        EstadoPrestamo = loan.Estado,
                        Estado = assignment.Estado,
                        IsQRAuthorized = assignment.IsQRAuthorized,
                        AssignedAt = assignment.AssignedAt
                    });
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return result;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
    }
}
