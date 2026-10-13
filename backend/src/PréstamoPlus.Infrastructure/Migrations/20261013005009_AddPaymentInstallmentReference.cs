using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentInstallmentReference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CuotasAplicadas",
                table: "Payments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CuotasAplicadas",
                table: "Payments");
        }
    }
}
