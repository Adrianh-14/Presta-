using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace PréstamoPlus.Infrastructure.Migrations;
public partial class AddComplimentarySubscriptions : Migration
{
    protected override void Up(MigrationBuilder m){m.AddColumn<bool>("IsComplimentary","Subscriptions",type:"boolean",nullable:false,defaultValue:false);m.AddColumn<DateTime>("ComplimentaryUntil","Subscriptions",type:"timestamp with time zone",nullable:true);m.AddColumn<string>("ComplimentaryNote","Subscriptions",type:"character varying(300)",maxLength:300,nullable:true);}
    protected override void Down(MigrationBuilder m){m.DropColumn("IsComplimentary","Subscriptions");m.DropColumn("ComplimentaryUntil","Subscriptions");m.DropColumn("ComplimentaryNote","Subscriptions");}
}
