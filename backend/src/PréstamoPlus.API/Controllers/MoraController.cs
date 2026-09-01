using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Domain.Interfaces;

namespace PréstamoPlus.API.Controllers;

[ApiController]
[Route("api/mora")]
[Authorize(Policy = AuthorizationPolicies.StaffRead)]
public sealed class MoraController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public MoraController(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId)) return Forbid();

        var loans = (await _unitOfWork.Loans.ListAsync(cancellationToken))
            .Where(loan => loan.TenantId == tenantId && loan.Estado != EstadoPrestamo.Cancelado)
            .ToList();
        var clients = (await _unitOfWork.Clients.ListAsync(cancellationToken))
            .Where(client => client.TenantId == tenantId)
            .ToDictionary(client => client.Id);
        var installments = await _unitOfWork.Installments.ListAsync(cancellationToken);
        var lateFees = await _unitOfWork.LateFees.ListAsync(cancellationToken);

        var rows = loans.Select(loan =>
        {
            var loanInstallments = installments.Where(item => item.LoanId == loan.Id).ToList();
            var loanLateFees = lateFees.Where(item => item.LoanId == loan.Id && item.Monto > 0).ToList();
            var overdueInstallments = loanInstallments
                .Where(item => item.Estado != EstadoInstallment.Pagado && item.FechaPago.Date < DateTime.UtcNow.Date)
                .ToList();
            var client = clients.GetValueOrDefault(loan.ClientId);
            var moraEvents = loanLateFees
                .Select(item => new
                {
                    item,
                    cuota = loanInstallments
                        .Where(i => i.FechaPago.Date <= item.FechaCalculo.Date)
                        .OrderByDescending(i => i.FechaPago)
                        .Select(i => (int?)i.Numero)
                        .FirstOrDefault()
                })
                .Where(item => item.cuota.HasValue)
                .GroupBy(item => item.cuota!.Value)
                .OrderBy(group => group.Key)
                .Select(group => new
                {
                    cuota = group.Key,
                    fechaInicio = group.Min(item => item.item.FechaCalculo),
                    fechaUltimoCargo = group.Max(item => item.item.FechaCalculo),
                    diasAtraso = group.Max(item => item.item.DiasAtraso),
                    monto = group.Sum(item => item.item.Monto),
                    pagado = group.All(item => item.item.Pagado),
                    cargosDiarios = group.Count()
                })
                .ToList();

            return new
            {
                loanId = loan.Id,
                clientId = loan.ClientId,
                cliente = client?.Nombre ?? "Cliente sin nombre",
                cedula = client?.Cedula,
                telefono = client?.Telefono,
                moneda = loan.Moneda,
                estado = loan.Estado.ToString(),
                tipo = loan.Tipo.ToString(),
                cuota = loan.CuotaMensual,
                saldo = loan.SaldoPendiente,
                moraPendiente = loanLateFees.Where(item => !item.Pagado).Sum(item => item.Monto),
                vecesEnMora = moraEvents.Count,
                cuotasAtrasadas = overdueInstallments.Count,
                moraEvents
            };
        }).ToList();

        var activeRows = rows.Where(row => row.moraPendiente > 0 || row.estado.Equals(nameof(EstadoPrestamo.Legal), StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(new
        {
            totalClientesEnMora = activeRows.Select(row => row.clientId).Distinct().Count(),
            totalPrestamosEnMora = activeRows.Count,
            totalMoraPendiente = activeRows.Sum(row => row.moraPendiente),
            totalCasosLegales = rows.Count(row => row.estado.Equals(nameof(EstadoPrestamo.Legal), StringComparison.OrdinalIgnoreCase)),
            porCuota = activeRows.SelectMany(row => row.moraEvents)
                .GroupBy(item => item.cuota)
                .Where(group => group.Key > 0)
                .OrderBy(group => group.Key)
                .Select(group => new { cuota = group.Key, eventos = group.Count(), monto = group.Sum(item => item.monto) }),
            prestamos = activeRows
        });
    }
}
