using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace PréstamoPlus.Infrastructure.Migrations;
public partial class AddPlatformPlans : Migration
{
    protected override void Up(MigrationBuilder m) => m.CreateTable(name: "PlatformPlans", columns: t => new { Id = t.Column<Guid>(type: "uuid", nullable: false), Code = t.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false), Nombre = t.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false), PrecioMensual = t.Column<decimal>(type: "numeric", nullable: false), Descripcion = t.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false), IsActive = t.Column<bool>(type: "boolean", nullable: false), UpdatedAt = t.Column<DateTime>(type: "timestamp with time zone", nullable: false) }, constraints: t => t.PrimaryKey("PK_PlatformPlans", x => x.Id));
    protected override void Down(MigrationBuilder m) => m.DropTable("PlatformPlans");
}
