using Ardalis.Specification;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Repositories;
using PréstamoPlus.Infrastructure.Services;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.Infrastructure.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var dbProvider = configuration.GetValue<string>("DatabaseProvider") ?? "PostgreSQL";

            var clientAuthenticationOptions = configuration
                .GetSection(ClientAuthenticationOptions.SectionName)
                .Get<ClientAuthenticationOptions>() ?? new ClientAuthenticationOptions();
            if (string.IsNullOrWhiteSpace(clientAuthenticationOptions.OtpPepper))
            {
                clientAuthenticationOptions.OtpPepper = Convert.ToBase64String(
                    RandomNumberGenerator.GetBytes(48));
            }
            services.AddSingleton<IOptions<ClientAuthenticationOptions>>(
                Options.Create(clientAuthenticationOptions));
            services.AddSingleton(TimeProvider.System);

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                switch (dbProvider.ToLower())
                {
                    case "sqlite":
                        options.UseSqlite(
                            configuration.GetConnectionString("DefaultConnection"),
                            b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                        break;
                    case "sqlserver":
                        options.UseSqlServer(
                            configuration.GetConnectionString("DefaultConnection"),
                            b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                        break;
                    default:
                        options.UseNpgsql(
                            configuration.GetConnectionString("DefaultConnection"),
                            b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
                        break;
                }
            });

            services.AddScoped(typeof(IRepositoryBase<>), typeof(GenericRepository<>));
            services.AddScoped<IClientRepository, ClientRepository>();
            services.AddScoped<ILoanApplicationRepository, LoanApplicationRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddSingleton<IPasswordService, PasswordService>();
            services.AddScoped<ITenantRegistrationService, TenantRegistrationService>();
            services.AddScoped<ITenantAccessService, TenantAccessService>();
            services.AddScoped<IClientAuthenticationService, ClientAuthenticationService>();
            services.AddScoped<IAuditLogService, AuditLogService>();
            services.AddScoped<IJournalService, JournalService>();
            services.AddScoped<ICashManagementService, CashManagementService>();
            services.AddScoped<IOutboxService, OutboxService>();
            services.AddScoped<IDistributedJobLock, DistributedJobLock>();
            services.AddScoped<ICapitalGuardService, CapitalGuardService>();
            services.AddScoped<IAnomalyDetectionService, AnomalyDetectionService>();
            services.AddScoped<IEntitlementsService, EntitlementsService>();
            services.AddScoped<IWebhookService, WebhookService>();
            services.AddScoped<ITenantConfigurationService, TenantConfigurationService>();
            services.AddSingleton<ClientOtpDeliveryQueue>();
            services.AddSingleton<IClientOtpDeliveryQueue>(provider =>
                provider.GetRequiredService<ClientOtpDeliveryQueue>());
            services.AddSingleton<IClientOtpSender, ResendClientOtpSender>();
            services.AddHostedService<ClientOtpDeliveryWorker>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddHostedService<LoanReminderService>();
            services.AddHostedService<DataRetentionService>();
            services.AddHostedService<SubscriptionLifecycleService>();

            return services;
        }
    }
}
