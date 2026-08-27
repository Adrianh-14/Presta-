using PréstamoPlus.Application.Common;
using Xunit;

namespace PréstamoPlus.Infrastructure.Tests;

public sealed class AccessControlTests
{
    [Fact]
    public void FinancialMutationRolesExcludeReadOnlyAndPortalRoles()
    {
        var forbidden = new[]
        {
            SystemRoles.Analista,
            SystemRoles.Auditor,
            SystemRoles.Cobrador,
            SystemRoles.Cliente
        };

        Assert.All(forbidden, role => Assert.DoesNotContain(role, RolePermissions.PaymentRecorders));
        Assert.All(forbidden, role => Assert.DoesNotContain(role, RolePermissions.LoanManagers));
        Assert.All(forbidden, role => Assert.DoesNotContain(role, RolePermissions.ExpenseManagers));
    }

    [Fact]
    public void ClientAndCollectorCannotReadTheGeneralStaffSurface()
    {
        Assert.DoesNotContain(SystemRoles.Cliente, RolePermissions.StaffReaders);
        Assert.DoesNotContain(SystemRoles.Cobrador, RolePermissions.StaffReaders);
        Assert.Contains(SystemRoles.Cliente, RolePermissions.StaffOrClientReaders);
    }

    [Fact]
    public void OnlyAdminCanManageUsers()
    {
        Assert.Equal([SystemRoles.Admin], RolePermissions.UserManagers);
    }

    [Fact]
    public void PubliclySuppliedPortalAndLegacyRolesCannotBeAssigned()
    {
        Assert.DoesNotContain(SystemRoles.Cliente, SystemRoles.AssignableStaff);
        Assert.DoesNotContain(SystemRoles.LegacyManager, SystemRoles.AssignableStaff);
        Assert.DoesNotContain(SystemRoles.LegacyOperator, SystemRoles.AssignableStaff);
    }
}
