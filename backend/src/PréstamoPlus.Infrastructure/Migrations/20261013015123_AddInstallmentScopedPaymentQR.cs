using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInstallmentScopedPaymentQR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InstallmentNumber",
                table: "PaymentQRs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AuthorizedQRInstallments",
                table: "CollectionAssignments",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentQRs_AssignmentId_InstallmentNumber_Status",
                table: "PaymentQRs",
                columns: new[] { "AssignmentId", "InstallmentNumber", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentQRs_AssignmentId_InstallmentNumber_Status",
                table: "PaymentQRs");

            migrationBuilder.DropColumn(
                name: "InstallmentNumber",
                table: "PaymentQRs");

            migrationBuilder.DropColumn(
                name: "AuthorizedQRInstallments",
                table: "CollectionAssignments");
        }
    }
}
