using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class AddCurrencyCapitalColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE IF EXISTS ""Tenants""
                ADD COLUMN IF NOT EXISTS ""CapitalInicialUsd"" numeric(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE IF EXISTS ""Tenants""
                ADD COLUMN IF NOT EXISTS ""CapitalInicialEur"" numeric(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE IF EXISTS ""TenantConfigs""
                ADD COLUMN IF NOT EXISTS ""CapitalInicialUsd"" numeric(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE IF EXISTS ""TenantConfigs""
                ADD COLUMN IF NOT EXISTS ""CapitalInicialEur"" numeric(18,2) NOT NULL DEFAULT 0;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("CapitalInicialUsd", "Tenants");
        migrationBuilder.DropColumn("CapitalInicialEur", "Tenants");
        migrationBuilder.DropColumn("CapitalInicialUsd", "TenantConfigs");
        migrationBuilder.DropColumn("CapitalInicialEur", "TenantConfigs");
    }
}
