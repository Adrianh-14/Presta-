using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services
{
    public class LoanManagementService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LoanManagementService> _logger;
        private static readonly SemaphoreSlim RunLock = new(1, 1);

        public LoanManagementService(
            IServiceScopeFactory scopeFactory,
            ILogger<LoanManagementService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var lockAcquired = false;
                try
                {
                    lockAcquired = await RunLock.WaitAsync(0, stoppingToken);
                    if (!lockAcquired)
                    {
                        _logger.LogWarning("LoanManagementService omitió una ejecución solapada.");
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        continue;
                    }

                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    await UpdateOverdueLoanStatuses(dbContext, stoppingToken);
                    var moraNotifications = await CalculateLateFees(dbContext, stoppingToken);

                    await dbContext.SaveChangesAsync(stoppingToken);

                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    foreach (var notification in moraNotifications)
                    {
                        if (string.IsNullOrWhiteSpace(notification.Client.Email)) continue;
                        var email = LoanEmailBuilder.Mora(
                            notification.Loan,
                            notification.Client,
                            notification.MoraPendiente,
                            notification.DiasAtraso,
                            notificationService.ClientPortalUrl);
                        await notificationService.SendEmailAsync(
                            notification.Client.Email,
                            email.Subject,
                            email.Html);
                    }

                    _logger.LogInformation("LoanManagementService ejecutado exitosamente a las {Time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    if (ex is OperationCanceledException && stoppingToken.IsCancellationRequested) break;
                    _logger.LogError(ex, "Error durante la ejecución de LoanManagementService");
                }
                finally
                {
                    if (lockAcquired) RunLock.Release();
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task UpdateOverdueLoanStatuses(ApplicationDbContext dbContext, CancellationToken cancellationToken)
        {
            var loansToUpdate = await dbContext.Loans
                .Where(l => l.Estado == EstadoPrestamo.Activo && l.FechaVencimiento < DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var loan in loansToUpdate)
            {
                loan.Estado = EstadoPrestamo.Vencido;
                _logger.LogInformation("Préstamo {LoanId} marcado como Vencido", loan.Id);
            }
        }

        private async Task<List<MoraNotification>> CalculateLateFees(
            ApplicationDbContext dbContext,
            CancellationToken cancellationToken)
        {
            var notifications = new List<MoraNotification>();
            var activeLoans = await dbContext.Loans
                .Where(l => l.Estado == EstadoPrestamo.Activo ||
                            l.Estado == EstadoPrestamo.Vencido ||
                            l.Estado == EstadoPrestamo.Mora)
                .Include(l => l.Client)
                .ToListAsync(cancellationToken);

            foreach (var loan in activeLoans)
            {
                var tenantConfig = await dbContext.TenantConfigs
                    .FirstOrDefaultAsync(tc => tc.TenantId == loan.TenantId, cancellationToken);

                var tasaDiaria = tenantConfig?.TasaMoraDiaria ?? 0.05m;
                var diasGracia = tenantConfig?.DiasGracia ?? 3;

                var overdueInstallments = await dbContext.Installments
                    .Where(i => i.LoanId == loan.Id &&
                                i.Estado != EstadoInstallment.Pagado &&
                                i.FechaPago.AddDays(diasGracia) < DateTime.UtcNow)
                    .ToListAsync(cancellationToken);

                if (!overdueInstallments.Any()) continue;

                var moraDiaria = 0m;
                foreach (var inst in overdueInstallments)
                {
                    var capitalPendiente = inst.Capital - inst.CapitalPagado;
                    if (capitalPendiente <= 0) continue;

                    var diasAtraso = (DateTime.UtcNow - inst.FechaPago.AddDays(diasGracia)).Days;
                    if (diasAtraso <= 0) continue;

                    // Cada registro representa exclusivamente la mora generada ese dia.
                    // Multiplicar nuevamente por los dias de atraso duplicaria cargos previos.
                    moraDiaria += capitalPendiente * tasaDiaria;

                    if (inst.Estado == EstadoInstallment.Pendiente)
                        inst.Estado = EstadoInstallment.Vencido;
                }

                if (moraDiaria > 0)
                {
                    var existeMoraHoy = await dbContext.LateFees
                        .AnyAsync(lf => lf.LoanId == loan.Id &&
                                       lf.FechaCalculo.Date == DateTime.UtcNow.Date,
                                  cancellationToken);

                    if (!existeMoraHoy)
                    {
                        var isEnteringMora = loan.Estado is EstadoPrestamo.Activo or EstadoPrestamo.Vencido;
                        var maxDiasAtraso = overdueInstallments
                            .Select(i => (DateTime.UtcNow - i.FechaPago.AddDays(diasGracia)).Days)
                            .Max();

                        var lateFee = new LateFee
                        {
                            Id = Guid.NewGuid(),
                            LoanId = loan.Id,
                            Monto = Math.Round(moraDiaria, 2),
                            DiasAtraso = maxDiasAtraso,
                            TasaAplicada = tasaDiaria,
                            FechaCalculo = DateTime.UtcNow,
                            Pagado = false
                        };

                        dbContext.LateFees.Add(lateFee);

                        if (loan.Estado == EstadoPrestamo.Activo || loan.Estado == EstadoPrestamo.Vencido)
                            loan.Estado = EstadoPrestamo.Mora;

                        if (isEnteringMora && loan.Client is not null)
                        {
                            var previousMora = await dbContext.LateFees
                                .Where(lf => lf.LoanId == loan.Id && !lf.Pagado)
                                .SumAsync(lf => (decimal?)lf.Monto, cancellationToken) ?? 0m;
                            notifications.Add(new MoraNotification(
                                loan,
                                loan.Client,
                                previousMora + lateFee.Monto,
                                maxDiasAtraso));
                        }

                        _logger.LogInformation(
                            "Mora calculada para préstamo {LoanId}: {Monto} (máx {DiasAtraso} días atraso, tasa {Tasa}, {Count} cuotas vencidas)",
                            loan.Id, lateFee.Monto, maxDiasAtraso, tasaDiaria, overdueInstallments.Count);
                    }
                }
            }

            return notifications;
        }

        private sealed record MoraNotification(
            Loan Loan,
            Client Client,
            decimal MoraPendiente,
            int DiasAtraso);
    }
}
