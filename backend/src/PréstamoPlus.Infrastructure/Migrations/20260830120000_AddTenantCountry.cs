using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace PréstamoPlus.Infrastructure.Migrations;

[Migration("20260830120000_AddTenantCountry")]
public partial class AddTenantCountry : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.AddColumn<string>("Pais", "Tenants", nullable: false, defaultValue: "DO");
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropColumn("Pais", "Tenants");
}
