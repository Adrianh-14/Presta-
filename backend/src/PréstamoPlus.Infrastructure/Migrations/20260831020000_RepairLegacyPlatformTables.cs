using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class RepairLegacyPlatformTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            CREATE TABLE IF NOT EXISTS ""PlatformPlans""
            (
                ""Id"" uuid NOT NULL,
                ""Code"" character varying(40) NOT NULL,
                ""Nombre"" character varying(120) NOT NULL,
                ""PrecioMensual"" numeric NOT NULL,
                ""Descripcion"" character varying(300) NOT NULL,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT ""PK_PlatformPlans"" PRIMARY KEY (""Id"")
            );
            CREATE TABLE IF NOT EXISTS ""PlatformPromotions""
            (
                ""Id"" uuid NOT NULL,
                ""IsActive"" boolean NOT NULL,
                ""AppliesToNewTenants"" boolean NOT NULL,
                ""StartsAt"" timestamp with time zone NOT NULL,
                ""EndsAt"" timestamp with time zone NOT NULL,
                ""Label"" character varying(200) NOT NULL,
                ""UpdatedAt"" timestamp with time zone NOT NULL,
                CONSTRAINT ""PK_PlatformPromotions"" PRIMARY KEY (""Id"")
            );");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("PlatformPromotions");
        migrationBuilder.DropTable("PlatformPlans");
    }
}
