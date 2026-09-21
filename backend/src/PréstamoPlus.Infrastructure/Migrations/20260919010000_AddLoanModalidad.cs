using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    public partial class AddLoanModalidad : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Modalidad",
                table: "Loans",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "AmortizacionFrancesa");

            migrationBuilder.AddColumn<string>(
                name: "Modalidad",
                table: "LoanApplications",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "AmortizacionFrancesa");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Modalidad", table: "Loans");
            migrationBuilder.DropColumn(name: "Modalidad", table: "LoanApplications");
        }
    }
}
