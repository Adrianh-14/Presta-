using MediatR;
using PréstamoPlus.Application.DTOs;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.Application.Features.Cobradores.Commands.RecordVisit
{
    public record RecordVisitCommand(Guid CollectorId, Guid AssignmentId, RecordVisitRequest Request) : IRequest<CollectionVisitDto>;

    public class RecordVisitCommandHandler : IRequestHandler<RecordVisitCommand, CollectionVisitDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public RecordVisitCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CollectionVisitDto> Handle(RecordVisitCommand request, CancellationToken cancellationToken)
        {
            var collector = await _unitOfWork.Collectors.GetByIdAsync(request.CollectorId);
            if (collector is null)
                throw new InvalidOperationException("Cobrador no encontrado.");

            var assignment = await _unitOfWork.CollectionAssignments.GetByIdAsync(request.AssignmentId);
            if (assignment is null || assignment.CollectorId != request.CollectorId)
                throw new InvalidOperationException("Asignación no encontrada.");

            var loan = await _unitOfWork.Loans.GetByIdAsync(assignment.LoanId);
            var client = loan is not null ? await _unitOfWork.Clients.GetByIdAsync(loan.ClientId) : null;
            if (loan is null || loan.TenantId != collector.TenantId ||
                client is null || client.TenantId != collector.TenantId)
                throw new InvalidOperationException("Asignación no encontrada.");

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                if (assignment.Estado == EstadoAsignacion.Asignado)
                    assignment.Estado = EstadoAsignacion.EnProgreso;

                await _unitOfWork.CollectionAssignments.UpdateAsync(assignment, cancellationToken);

                if (request.Request.TipoVisita == TipoVisita.CobroExitoso || request.Request.TipoVisita == TipoVisita.CobroParcial)
                    assignment.Estado = EstadoAsignacion.Completado;

                var visit = new CollectionVisit
                {
                    Id = Guid.NewGuid(),
                    AssignmentId = request.AssignmentId,
                    CollectorId = request.CollectorId,
                    LoanId = assignment.LoanId,
                    TipoVisita = request.Request.TipoVisita,
                    MontoRecibido = request.Request.MontoRecibido,
                    Notas = request.Request.Notas,
                    Latitud = request.Request.Latitud,
                    Longitud = request.Request.Longitud,
                    FotoUrl = request.Request.FotoUrl,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.CollectionVisits.AddAsync(visit, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return new CollectionVisitDto
                {
                    Id = visit.Id,
                    AssignmentId = visit.AssignmentId,
                    CollectorId = visit.CollectorId,
                    LoanId = visit.LoanId,
                    ClienteNombre = client?.Nombre ?? "",
                    TipoVisita = visit.TipoVisita,
                    MontoRecibido = visit.MontoRecibido,
                    Notas = visit.Notas,
                    Latitud = visit.Latitud,
                    Longitud = visit.Longitud,
                    FotoUrl = visit.FotoUrl,
                    CreatedAt = visit.CreatedAt
                };
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
    }
}
