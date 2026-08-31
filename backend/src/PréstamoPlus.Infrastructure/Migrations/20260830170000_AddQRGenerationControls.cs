using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    public partial class AddQRGenerationControls : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>("QRGenerationAttempts", "CollectionAssignments", type: "integer", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<bool>("QRPermissionRequested", "CollectionAssignments", type: "boolean", nullable: false, defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn("QRGenerationAttempts", "CollectionAssignments");
            migrationBuilder.DropColumn("QRPermissionRequested", "CollectionAssignments");
        }
    }
}
