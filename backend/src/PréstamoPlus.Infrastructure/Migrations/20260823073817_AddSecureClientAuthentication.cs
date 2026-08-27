using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSecureClientAuthentication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientAuthenticationEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChallengeId = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IdentifierHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RemoteAddressHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientAuthenticationEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientOtpChallenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IdentifierHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RequestAddressHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientOtpChallenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientOtpChallenges_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAddressHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientSessions_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientAuthenticationEvents_CreatedAt",
                table: "ClientAuthenticationEvents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ClientAuthenticationEvents_TenantId_ClientId_CreatedAt",
                table: "ClientAuthenticationEvents",
                columns: new[] { "TenantId", "ClientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientOtpChallenges_ClientId",
                table: "ClientOtpChallenges",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientOtpChallenges_ExpiresAt",
                table: "ClientOtpChallenges",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ClientOtpChallenges_TenantId_ClientId_CreatedAt",
                table: "ClientOtpChallenges",
                columns: new[] { "TenantId", "ClientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientSessions_ClientId",
                table: "ClientSessions",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientSessions_RevokedAt",
                table: "ClientSessions",
                column: "RevokedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ClientSessions_TenantId_ClientId_ExpiresAt",
                table: "ClientSessions",
                columns: new[] { "TenantId", "ClientId", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientAuthenticationEvents");

            migrationBuilder.DropTable(
                name: "ClientOtpChallenges");

            migrationBuilder.DropTable(
                name: "ClientSessions");
        }
    }
}
