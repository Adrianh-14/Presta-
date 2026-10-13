using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientContactEmailOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientContactOtpChallenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<string>(type: "text", nullable: false),
                    ValueHash = table.Column<string>(type: "text", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientContactOtpChallenges", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientContactOtpChallenges");
        }
    }
}
