using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientProfileRefreshAndApprovals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClientProfileRefreshMonths",
                table: "TenantConfigs",
                type: "integer",
                nullable: false,
                defaultValue: 6);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProfileReviewedAt",
                table: "Clients",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientProfileUpdateRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewNote = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientProfileUpdateRequests", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientProfileUpdateRequests");

            migrationBuilder.DropColumn(
                name: "ClientProfileRefreshMonths",
                table: "TenantConfigs");

            migrationBuilder.DropColumn(
                name: "ProfileReviewedAt",
                table: "Clients");
        }
    }
}
