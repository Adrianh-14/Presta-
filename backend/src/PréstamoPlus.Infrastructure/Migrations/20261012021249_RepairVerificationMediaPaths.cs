using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RepairVerificationMediaPaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE IF EXISTS ""VerificationMedia""
                    ADD COLUMN IF NOT EXISTS ""GarantiaPath"" character varying(500) NULL;
                ALTER TABLE IF EXISTS ""VerificationMedia""
                    ADD COLUMN IF NOT EXISTS ""ContratoPath"" character varying(500) NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally left empty. These columns are repaired for compatibility
            // with databases whose migration history is ahead of their physical schema.
        }
    }
}
