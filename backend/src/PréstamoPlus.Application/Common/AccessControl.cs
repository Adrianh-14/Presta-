namespace PréstamoPlus.Application.Common;

public static class SystemRoles
{
    public const string Admin = "Admin";
    public const string Analista = "Analista";
    public const string Aprobador = "Aprobador";
    public const string Cajero = "Cajero";
    public const string Cobrador = "Cobrador";
    public const string Auditor = "Auditor";
    public const string Cliente = "Cliente";

    // Compatibilidad durante la migración de los usuarios demo existentes.
    public const string LegacyManager = "Manager";
    public const string LegacyOperator = "Operator";

    public static readonly IReadOnlySet<string> AssignableStaff = new HashSet<string>(
        [Admin, Analista, Aprobador, Cajero, Cobrador, Auditor],
        StringComparer.OrdinalIgnoreCase);
}

public static class AuthorizationPolicies
{
    public const string StaffRead = nameof(StaffRead);
    public const string StaffOrClientRead = nameof(StaffOrClientRead);
    public const string ReadPii = nameof(ReadPii);
    public const string ManageClients = nameof(ManageClients);
    public const string ApproveApplications = nameof(ApproveApplications);
    public const string ManageLoans = nameof(ManageLoans);
    public const string RecordPayments = nameof(RecordPayments);
    public const string ReadFinancial = nameof(ReadFinancial);
    public const string ManageCollectors = nameof(ManageCollectors);
    public const string ManageExpenses = nameof(ManageExpenses);
    public const string ManageUsers = nameof(ManageUsers);
    public const string ClientPortal = nameof(ClientPortal);
    public const string CollectorPortal = nameof(CollectorPortal);
}

public static class RolePermissions
{
    public static readonly string[] StaffReaders =
    [
        SystemRoles.Admin, SystemRoles.Analista, SystemRoles.Aprobador,
        SystemRoles.Cajero, SystemRoles.Auditor,
        SystemRoles.LegacyManager, SystemRoles.LegacyOperator
    ];

    public static readonly string[] PiiReaders =
    [
        SystemRoles.Admin, SystemRoles.Analista, SystemRoles.Aprobador,
        SystemRoles.Auditor, SystemRoles.LegacyManager
    ];

    public static readonly string[] StaffOrClientReaders =
    [.. StaffReaders, SystemRoles.Cliente];

    public static readonly string[] ClientManagers =
    [SystemRoles.Admin, SystemRoles.Analista, SystemRoles.LegacyManager];

    public static readonly string[] ApplicationApprovers =
    [SystemRoles.Admin, SystemRoles.Aprobador, SystemRoles.LegacyManager];

    public static readonly string[] LoanManagers =
    [SystemRoles.Admin, SystemRoles.Aprobador, SystemRoles.LegacyManager];

    public static readonly string[] PaymentRecorders =
    [SystemRoles.Admin, SystemRoles.Cajero, SystemRoles.LegacyOperator];

    public static readonly string[] FinancialReaders =
    [
        SystemRoles.Admin, SystemRoles.Aprobador, SystemRoles.Cajero,
        SystemRoles.Auditor, SystemRoles.LegacyManager, SystemRoles.LegacyOperator
    ];

    public static readonly string[] CollectorManagers =
    [SystemRoles.Admin, SystemRoles.LegacyManager];

    public static readonly string[] ExpenseManagers =
    [SystemRoles.Admin, SystemRoles.Cajero, SystemRoles.LegacyManager];

    public static readonly string[] UserManagers = [SystemRoles.Admin];
}
