using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

[DbContext(typeof(PréstamoPlus.Infrastructure.Persistence.ApplicationDbContext))]
[Migration("20260920071000_AddClientDecisionFields")]
partial class AddClientDecisionFields
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder) { }
}
