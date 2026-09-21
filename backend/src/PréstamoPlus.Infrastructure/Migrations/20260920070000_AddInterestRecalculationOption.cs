using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

/// <summary>Stores whether interest-only loans recalculate future interest after capital abonos.</summary>
public partial class AddInterestRecalculationOption : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "RecalcularInteresSobreSaldo",
            table: "Loans",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "RecalcularInteresSobreSaldo",
            table: "LoanApplications",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "RecalcularInteresSobreSaldo", table: "Loans");
        migrationBuilder.DropColumn(name: "RecalcularInteresSobreSaldo", table: "LoanApplications");
    }
}
