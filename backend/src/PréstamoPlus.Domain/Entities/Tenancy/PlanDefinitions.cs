namespace PréstamoPlus.Domain.Entities.Tenancy
{
    public static class PlanDefinitions
    {
        public static readonly Dictionary<string, PlanFeatures> Plans = new()
        {
            ["basic"] = new PlanFeatures
            {
                Name = "Basic",
                PriceMonthly = 49m,
                MaxClients = 100,
                MaxLoans = 50,
                MaxUsers = 3,
                CanViewDashboard = true,
                CanManageClients = true,
                CanManageLoans = true,
                CanApproveSolicitudes = true,
                CanViewReports = false,
                CanAccessApi = false,
                CanWhiteLabel = false
            },
            ["pro"] = new PlanFeatures
            {
                Name = "Pro",
                PriceMonthly = 149m,
                MaxClients = 500,
                MaxLoans = 250,
                MaxUsers = 10,
                CanViewDashboard = true,
                CanManageClients = true,
                CanManageLoans = true,
                CanApproveSolicitudes = true,
                CanViewReports = true,
                CanAccessApi = true,
                CanWhiteLabel = false
            },
            ["enterprise"] = new PlanFeatures
            {
                Name = "Enterprise",
                PriceMonthly = 499m,
                MaxClients = -1,
                MaxLoans = -1,
                MaxUsers = -1,
                CanViewDashboard = true,
                CanManageClients = true,
                CanManageLoans = true,
                CanApproveSolicitudes = true,
                CanViewReports = true,
                CanAccessApi = true,
                CanWhiteLabel = true
            }
        };
    }

    public class PlanFeatures
    {
        public string Name { get; set; } = string.Empty;
        public decimal PriceMonthly { get; set; }
        public int MaxClients { get; set; }
        public int MaxLoans { get; set; }
        public int MaxUsers { get; set; }
        public bool CanViewDashboard { get; set; }
        public bool CanManageClients { get; set; }
        public bool CanManageLoans { get; set; }
        public bool CanApproveSolicitudes { get; set; }
        public bool CanViewReports { get; set; }
        public bool CanAccessApi { get; set; }
        public bool CanWhiteLabel { get; set; }
    }
}
