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
            var useSqlite = configuration.GetValue<bool>("UseSqlite");

            if (useSqlite)
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlite(
                        configuration.GetConnectionString("DefaultConnection"),
                        b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
            }
            else
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlServer(
                        configuration.GetConnectionString("DefaultConnection"),
                        b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
            }

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
