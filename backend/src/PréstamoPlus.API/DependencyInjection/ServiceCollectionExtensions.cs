using System.Text.Json.Serialization;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using PréstamoPlus.Application.Features.Solicituds.Commands.CreateSolicitud;

namespace PréstamoPlus.API.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApi(this IServiceCollection services)
        {
            services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new() { Title = "PréstamoPlus API", Version = "v1" });
            });

            services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            return services;
        }

        public static IServiceCollection AddApplicationDecorators(this IServiceCollection services)
        {
            var applicationAssembly = typeof(CreateSolicitudCommand).Assembly;
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(applicationAssembly));
            services.AddValidatorsFromAssembly(applicationAssembly);
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            return services;
        }
    }
}
