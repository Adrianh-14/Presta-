using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using PréstamoPlus.Application.Common;

namespace PréstamoPlus.API.Configuration;

internal static class AuthorizationConfiguration
{
    private static readonly TimeSpan StepUpWindow = TimeSpan.FromMinutes(10);

    public static IServiceCollection AddPrestamoPlusAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            AddRolePolicy(options, AuthorizationPolicies.StaffRead, RolePermissions.StaffReaders);
            AddRolePolicy(options, AuthorizationPolicies.StaffOrClientRead, RolePermissions.StaffOrClientReaders);
            AddRolePolicy(options, AuthorizationPolicies.ReadPii, RolePermissions.PiiReaders);
            AddRolePolicy(options, AuthorizationPolicies.ManageClients, RolePermissions.ClientManagers);
            AddStepUpPolicy(options, AuthorizationPolicies.ApproveApplications, RolePermissions.ApplicationApprovers);
            AddStepUpPolicy(options, AuthorizationPolicies.ManageLoans, RolePermissions.LoanManagers);
            AddStepUpPolicy(options, AuthorizationPolicies.RecordPayments, RolePermissions.PaymentRecorders);
            AddRolePolicy(options, AuthorizationPolicies.ReadFinancial, RolePermissions.FinancialReaders);
            AddStepUpPolicy(options, AuthorizationPolicies.ManageCollectors, RolePermissions.CollectorManagers);
            AddStepUpPolicy(options, AuthorizationPolicies.ManageExpenses, RolePermissions.ExpenseManagers);
            AddStepUpPolicy(options, AuthorizationPolicies.ManageUsers, RolePermissions.UserManagers);
            AddRolePolicy(options, AuthorizationPolicies.ClientPortal, [SystemRoles.Cliente]);
            AddRolePolicy(options, AuthorizationPolicies.CollectorPortal, [SystemRoles.Cobrador]);
        });

        return services;
    }

    private static void AddRolePolicy(
        AuthorizationOptions options,
        string name,
        IEnumerable<string> roles) =>
        options.AddPolicy(name, policy => policy
            .RequireAuthenticatedUser()
            .RequireRole(roles));

    private static void AddStepUpPolicy(
        AuthorizationOptions options,
        string name,
        IEnumerable<string> roles) =>
        options.AddPolicy(name, policy => policy
            .RequireAuthenticatedUser()
            .RequireRole(roles)
            .RequireAssertion(context => HasRecentPasswordAuthentication(context.User)));

    internal static bool HasRecentPasswordAuthentication(System.Security.Claims.ClaimsPrincipal user)
    {
        var raw = user.FindFirst("auth_time")?.Value;
        if (!long.TryParse(raw, NumberStyles.None, CultureInfo.InvariantCulture, out var seconds))
        {
            return false;
        }

        var authenticatedAt = DateTimeOffset.FromUnixTimeSeconds(seconds);
        var age = DateTimeOffset.UtcNow - authenticatedAt;
        return age >= TimeSpan.Zero && age <= StepUpWindow;
    }
}
