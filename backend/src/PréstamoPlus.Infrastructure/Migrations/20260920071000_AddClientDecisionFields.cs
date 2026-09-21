using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class AddClientDecisionFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "ClientDecisionToken", table: "LoanApplications", type: "text", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "ClientDecisionAt", table: "LoanApplications", type: "timestamp with time zone", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ClientDecisionToken", table: "LoanApplications");
        migrationBuilder.DropColumn(name: "ClientDecisionAt", table: "LoanApplications");
    }
}
