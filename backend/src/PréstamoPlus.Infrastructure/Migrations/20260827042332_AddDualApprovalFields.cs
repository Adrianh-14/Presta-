using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDualApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FirstApprovedAt",
                table: "LoanApplications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FirstApprovedBy",
                table: "LoanApplications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SecondApprovedAt",
                table: "LoanApplications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SecondApprovedBy",
                table: "LoanApplications",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstApprovedAt",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "FirstApprovedBy",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "SecondApprovedAt",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "SecondApprovedBy",
                table: "LoanApplications");
        }
    }
}
