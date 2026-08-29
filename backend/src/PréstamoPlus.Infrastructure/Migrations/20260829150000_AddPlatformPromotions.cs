using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace PréstamoPlus.Infrastructure.Migrations;
public partial class AddPlatformPromotions : Migration
{
    protected override void Up(MigrationBuilder m)=>m.CreateTable(name:"PlatformPromotions",columns:t=>new{Id=t.Column<Guid>(type:"uuid",nullable:false),IsActive=t.Column<bool>(type:"boolean",nullable:false),AppliesToNewTenants=t.Column<bool>(type:"boolean",nullable:false),StartsAt=t.Column<DateTime>(type:"timestamp with time zone",nullable:false),EndsAt=t.Column<DateTime>(type:"timestamp with time zone",nullable:false),Label=t.Column<string>(type:"character varying(200)",maxLength:200,nullable:false),UpdatedAt=t.Column<DateTime>(type:"timestamp with time zone",nullable:false)},constraints:t=>t.PrimaryKey("PK_PlatformPromotions",x=>x.Id));
    protected override void Down(MigrationBuilder m)=>m.DropTable("PlatformPromotions");
}
