using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

[DbContext(typeof(PréstamoPlus.Infrastructure.Persistence.ApplicationDbContext))]
[Migration("20260920060000_AddInterestFrequency")]
partial class AddInterestFrequency
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        // The runtime migration only adds two backward-compatible columns. The
        // current model snapshot remains the source of truth for future diffs.
    }
}
