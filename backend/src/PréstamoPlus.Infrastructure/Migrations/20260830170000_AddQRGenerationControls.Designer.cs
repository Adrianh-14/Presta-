using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations
{
    [DbContext(typeof(Persistence.ApplicationDbContext))]
    [Migration("20260830170000_AddQRGenerationControls")]
    partial class AddQRGenerationControls
    {
    }
}
