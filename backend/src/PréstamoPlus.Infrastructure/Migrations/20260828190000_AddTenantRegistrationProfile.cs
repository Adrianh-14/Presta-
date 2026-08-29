using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PréstamoPlus.Infrastructure.Persistence;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260828190000_AddTenantRegistrationProfile")]
public partial class AddTenantRegistrationProfile : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>("CapitalInicial", "Tenants", type: "numeric(18,2)", nullable: false, defaultValue: 0m);
        migrationBuilder.AddColumn<string>("TipoEmpresa", "Tenants", type: "character varying(80)", maxLength: 80, nullable: true);
        migrationBuilder.AddColumn<string>("ActividadEconomica", "Tenants", type: "character varying(160)", maxLength: 160, nullable: true);
        migrationBuilder.AddColumn<string>("Direccion", "Tenants", type: "character varying(250)", maxLength: 250, nullable: true);
        migrationBuilder.AddColumn<string>("Ciudad", "Tenants", type: "character varying(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<string>("Provincia", "Tenants", type: "character varying(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<string>("SitioWeb", "Tenants", type: "character varying(250)", maxLength: 250, nullable: true);
        migrationBuilder.AddColumn<int>("CantidadEmpleados", "Tenants", type: "integer", nullable: true);
        migrationBuilder.AddColumn<string>("RepresentanteTipoIdentificacion", "Tenants", type: "character varying(30)", maxLength: 30, nullable: true);
        migrationBuilder.AddColumn<string>("RepresentanteNumeroIdentificacion", "Tenants", type: "character varying(40)", maxLength: 40, nullable: true);
        migrationBuilder.AddColumn<string>("RepresentanteFotoIdentificacionPath", "Tenants", type: "character varying(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<string>("RepresentanteFotoPath", "Tenants", type: "character varying(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<decimal>("CapitalInicial", "TenantConfigs", type: "numeric(18,2)", nullable: false, defaultValue: 0m);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("CapitalInicial", "Tenants");
        migrationBuilder.DropColumn("TipoEmpresa", "Tenants");
        migrationBuilder.DropColumn("ActividadEconomica", "Tenants");
        migrationBuilder.DropColumn("Direccion", "Tenants");
        migrationBuilder.DropColumn("Ciudad", "Tenants");
        migrationBuilder.DropColumn("Provincia", "Tenants");
        migrationBuilder.DropColumn("SitioWeb", "Tenants");
        migrationBuilder.DropColumn("CantidadEmpleados", "Tenants");
        migrationBuilder.DropColumn("RepresentanteTipoIdentificacion", "Tenants");
        migrationBuilder.DropColumn("RepresentanteNumeroIdentificacion", "Tenants");
        migrationBuilder.DropColumn("RepresentanteFotoIdentificacionPath", "Tenants");
        migrationBuilder.DropColumn("RepresentanteFotoPath", "Tenants");
        migrationBuilder.DropColumn("CapitalInicial", "TenantConfigs");
    }
}
