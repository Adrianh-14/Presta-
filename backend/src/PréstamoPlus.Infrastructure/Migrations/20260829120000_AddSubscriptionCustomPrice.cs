using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace PréstamoPlus.Infrastructure.Migrations;

public partial class AddSubscriptionCustomPrice : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.AddColumn<decimal>(
        name: "CustomPrice", table: "Subscriptions", type: "numeric", nullable: true);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropColumn(
        name: "CustomPrice", table: "Subscriptions");
}
