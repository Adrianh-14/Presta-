using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

[DbContext(typeof(PréstamoPlus.Infrastructure.Persistence.ApplicationDbContext))]
[Migration("20260920070000_AddInterestRecalculationOption")]
partial class AddInterestRecalculationOption
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        // The runtime migration only adds backward-compatible columns.
        // The model snapshot remains the source of truth for future diffs.
    }
}
