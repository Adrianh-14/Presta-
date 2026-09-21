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

                    await ExtendInterestOnlyLoans(dbContext, stoppingToken);
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
                .Where(l => l.Estado == EstadoPrestamo.Activo &&
                            l.Modalidad != ModalidadPrestamo.InteresPeriodicoSobreSaldo &&
                            l.FechaVencimiento < DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var loan in loansToUpdate)
            {
                loan.Estado = EstadoPrestamo.Vencido;
                _logger.LogInformation("Préstamo {LoanId} marcado como Vencido", loan.Id);
            }
        }

        /// <summary>
        /// Interest-only loans do not expire when the initial term ends. The
        /// term is the initial schedule; while capital remains, create the next
        /// interest-only periods so payments can continue indefinitely.
        /// </summary>
        private async Task ExtendInterestOnlyLoans(ApplicationDbContext dbContext, CancellationToken cancellationToken)
        {
            var loans = await dbContext.Loans
                .Where(l => l.Modalidad == ModalidadPrestamo.InteresPeriodicoSobreSaldo &&
                            l.Estado != EstadoPrestamo.Pagado &&
                            l.Estado != EstadoPrestamo.Cancelado &&
                            l.Estado != EstadoPrestamo.Legal &&
                            l.SaldoPendiente > 0)
                .Include(l => l.Installments)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            foreach (var loan in loans)
            {
                var last = loan.Installments.OrderBy(i => i.Numero).LastOrDefault();
                if (last is null) continue;

                var periodsPerMonth = loan.FrecuenciaPago switch
                {
                    FrecuenciaPago.Diaria => 30m,
                    FrecuenciaPago.Semanal => 4m,
                    FrecuenciaPago.Quincenal => 2m,
                    _ => 1m
                };
                var ratePerPeriod = (loan.TasaInteresAnual / 100m / 12m) / periodsPerMonth;
                var nextNumber = last.Numero + 1;
                var nextDate = last.FechaPago;

                while (nextDate.Date <= now.Date)
                {
                    nextDate = loan.FrecuenciaPago switch
                    {
                        FrecuenciaPago.Diaria => nextDate.AddDays(1),
                        FrecuenciaPago.Semanal => nextDate.AddDays(7),
                        FrecuenciaPago.Quincenal => nextDate.AddDays(15),
                        _ => nextDate.AddMonths(1)
                    };

                    if (nextDate.Date > now.Date) break;

                    var interestBase = loan.RecalcularInteresSobreSaldo ? loan.SaldoPendiente : loan.MontoOriginal;
                    var interest = Math.Round(interestBase * ratePerPeriod, 2);
                    var continuation = new Installment
                    {
                        Id = Guid.NewGuid(),
                        LoanId = loan.Id,
                        Numero = nextNumber++,
                        FechaPago = nextDate,
                        Capital = 0m,
                        Interes = interest,
                        Cuota = interest,
                        CapitalPagado = 0m,
                        InteresPagado = 0m,
                        MoraPagada = 0m,
                        Estado = EstadoInstallment.Pendiente
                    };
                    dbContext.Installments.Add(continuation);
                    loan.Installments.Add(continuation);
                    loan.FechaVencimiento = nextDate;
                    _logger.LogInformation("Período de interés extendido para préstamo {LoanId}: {FechaPago}", loan.Id, nextDate);
                }
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
                // En préstamos diarios la mora comienza al día siguiente de la
                // fecha de vencimiento. La gracia configurable se conserva para
                // préstamos semanales, quincenales y mensuales.
                var diasGracia = loan.FrecuenciaPago == FrecuenciaPago.Diaria
                    ? 0
                    : tenantConfig?.DiasGracia ?? 3;

                var overdueInstallments = await dbContext.Installments
                    .Where(i => i.LoanId == loan.Id &&
                                i.Estado != EstadoInstallment.Pagado &&
                                i.FechaPago.AddDays(diasGracia) < DateTime.UtcNow)
                    .ToListAsync(cancellationToken);

                if (!overdueInstallments.Any()) continue;

                var moraDiaria = 0m;
                foreach (var inst in overdueInstallments)
                {
                    var saldoVencido = loan.Modalidad == ModalidadPrestamo.InteresPeriodicoSobreSaldo
                        ? inst.Interes - inst.InteresPagado
                        : inst.Capital - inst.CapitalPagado;
                    if (saldoVencido <= 0) continue;

                    var diasAtraso = (DateTime.UtcNow - inst.FechaPago.AddDays(diasGracia)).Days;
                    if (diasAtraso <= 0) continue;

                    // Cada registro representa exclusivamente la mora generada ese dia.
                    // Multiplicar nuevamente por los dias de atraso duplicaria cargos previos.
                    moraDiaria += saldoVencido * tasaDiaria;

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
