using Ardalis.Specification;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;
using PréstamoPlus.Infrastructure.Repositories;
using PréstamoPlus.Infrastructure.Services;

namespace PréstamoPlus.Infrastructure.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var dbProvider = configuration.GetValue<string>("DatabaseProvider") ?? "PostgreSQL";

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
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddHostedService<LoanReminderService>();

            return services;
        }
    }
}
