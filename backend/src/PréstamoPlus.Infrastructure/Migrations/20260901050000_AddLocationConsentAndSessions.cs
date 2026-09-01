using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class AddLocationConsentAndSessions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "LocationConsentEvidence", columns: table => new
        {
            Id = table.Column<Guid>(type: "uuid", nullable: false), TenantId = table.Column<Guid>(type: "uuid", nullable: false), ClientId = table.Column<Guid>(type: "uuid", nullable: false), LoanId = table.Column<Guid>(type: "uuid", nullable: true), Purpose = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false), Scope = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false), TermsVersion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false), ConsentTextHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false), GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), IpAddress = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true), UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true), DeviceId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
        }, constraints: table => table.PrimaryKey("PK_LocationConsentEvidence", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_LocationConsentEvidence_TenantId_ClientId_GrantedAt", table: "LocationConsentEvidence", columns: new[] { "TenantId", "ClientId", "GrantedAt" });
        migrationBuilder.CreateTable(name: "LocationShareSessions", columns: table => new
        {
            Id = table.Column<Guid>(type: "uuid", nullable: false), TenantId = table.Column<Guid>(type: "uuid", nullable: false), ClientId = table.Column<Guid>(type: "uuid", nullable: false), LoanId = table.Column<Guid>(type: "uuid", nullable: false), CollectorId = table.Column<Guid>(type: "uuid", nullable: false), ConsentId = table.Column<Guid>(type: "uuid", nullable: false), StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false), LastLatitude = table.Column<double>(type: "double precision", nullable: true), LastLongitude = table.Column<double>(type: "double precision", nullable: true), LastAccuracy = table.Column<double>(type: "double precision", nullable: true), LastUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
        }, constraints: table => table.PrimaryKey("PK_LocationShareSessions", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_LocationShareSessions_TenantId_ClientId_Status", table: "LocationShareSessions", columns: new[] { "TenantId", "ClientId", "Status" });
        migrationBuilder.CreateIndex(name: "IX_LocationShareSessions_TenantId_CollectorId_ExpiresAt", table: "LocationShareSessions", columns: new[] { "TenantId", "CollectorId", "ExpiresAt" });
        migrationBuilder.CreateTable(name: "LocationAccessAudits", columns: table => new
        {
            Id = table.Column<Guid>(type: "uuid", nullable: false), TenantId = table.Column<Guid>(type: "uuid", nullable: false), SessionId = table.Column<Guid>(type: "uuid", nullable: false), ViewerUserId = table.Column<Guid>(type: "uuid", nullable: false), Action = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false), CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
        }, constraints: table => table.PrimaryKey("PK_LocationAccessAudits", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_LocationAccessAudits_TenantId_SessionId_CreatedAt", table: "LocationAccessAudits", columns: new[] { "TenantId", "SessionId", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "LocationAccessAudits");
        migrationBuilder.DropTable(name: "LocationShareSessions");
        migrationBuilder.DropTable(name: "LocationConsentEvidence");
    }
}
