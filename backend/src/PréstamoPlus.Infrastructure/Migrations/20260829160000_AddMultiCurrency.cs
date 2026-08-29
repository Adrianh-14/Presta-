using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class AddMultiCurrency : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>("Moneda", "Loans", maxLength: 3, type: "character varying(3)", nullable: false, defaultValue: "DOP");
        migrationBuilder.AddColumn<string>("Moneda", "LoanApplications", maxLength: 3, type: "character varying(3)", nullable: false, defaultValue: "DOP");
        migrationBuilder.AddColumn<string>("Moneda", "Payments", maxLength: 3, type: "character varying(3)", nullable: false, defaultValue: "DOP");
        migrationBuilder.AddColumn<string>("Moneda", "PaymentQRs", maxLength: 3, type: "character varying(3)", nullable: false, defaultValue: "DOP");
        migrationBuilder.AddColumn<string>("MonedaPredeterminada", "Tenants", maxLength: 3, type: "character varying(3)", nullable: false, defaultValue: "DOP");
        migrationBuilder.AddColumn<string>("MonedasHabilitadas", "Tenants", maxLength: 30, type: "character varying(30)", nullable: false, defaultValue: "DOP");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("Moneda", "Loans");
        migrationBuilder.DropColumn("Moneda", "LoanApplications");
        migrationBuilder.DropColumn("Moneda", "Payments");
        migrationBuilder.DropColumn("Moneda", "PaymentQRs");
        migrationBuilder.DropColumn("MonedaPredeterminada", "Tenants");
        migrationBuilder.DropColumn("MonedasHabilitadas", "Tenants");
    }
}
