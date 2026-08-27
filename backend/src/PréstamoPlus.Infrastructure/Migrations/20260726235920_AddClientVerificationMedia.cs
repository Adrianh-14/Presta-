using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientVerificationMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "LoanApplicationId",
                table: "VerificationMedia",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "VerificationMedia",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationMedia_ClientId",
                table: "VerificationMedia",
                column: "ClientId",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_VerificationMedia_Owner",
                table: "VerificationMedia",
                sql: "(\"LoanApplicationId\" IS NOT NULL AND \"ClientId\" IS NULL) OR (\"LoanApplicationId\" IS NULL AND \"ClientId\" IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "FK_VerificationMedia_Clients_ClientId",
                table: "VerificationMedia",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VerificationMedia_Clients_ClientId",
                table: "VerificationMedia");

            migrationBuilder.DropIndex(
                name: "IX_VerificationMedia_ClientId",
                table: "VerificationMedia");

            migrationBuilder.DropCheckConstraint(
                name: "CK_VerificationMedia_Owner",
                table: "VerificationMedia");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "VerificationMedia");

            migrationBuilder.AlterColumn<Guid>(
                name: "LoanApplicationId",
                table: "VerificationMedia",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
