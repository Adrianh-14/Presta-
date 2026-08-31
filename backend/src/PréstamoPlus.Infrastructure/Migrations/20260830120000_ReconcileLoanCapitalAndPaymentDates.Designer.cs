using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

[DbContext(typeof(Persistence.ApplicationDbContext))]
[Migration("20260830120000_ReconcileLoanCapitalAndPaymentDates")]
partial class ReconcileLoanCapitalAndPaymentDates
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        // La migración contiene SQL idempotente de conciliación; el modelo vigente
        // se mantiene en ApplicationDbContextModelSnapshot.
    }
}
