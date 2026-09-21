using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

/// <summary>Adds the declared frequency of the interest rate without changing existing loan math.</summary>
public partial class AddInterestFrequency : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "FrecuenciaInteres",
            table: "Loans",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Mensual");

        migrationBuilder.AddColumn<string>(
            name: "FrecuenciaInteres",
            table: "LoanApplications",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Mensual");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "FrecuenciaInteres", table: "Loans");
        migrationBuilder.DropColumn(name: "FrecuenciaInteres", table: "LoanApplications");
    }
}
