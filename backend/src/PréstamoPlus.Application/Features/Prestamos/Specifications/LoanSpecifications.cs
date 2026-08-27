using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Features.Prestamos.Specifications
{
    public class LoanByIdWithClientSpec : Specification<Loan>
    {
        public LoanByIdWithClientSpec(Guid id)
        {
            Query
                .Include(l => l.Client)
                .Where(l => l.Id == id)
                .AsNoTracking();
        }
    }

    public class AllLoansWithClientSpec : Specification<Loan>
    {
        public AllLoansWithClientSpec(string? search = null, Guid? tenantId = null)
        {
            Query
                .Include(l => l.Client);

            if (tenantId.HasValue && tenantId.Value != Guid.Empty)
                Query.Where(l => l.TenantId == tenantId.Value);

            if (!string.IsNullOrWhiteSpace(search))
                Query.Where(l => l.Client.Nombre.Contains(search));

            Query.OrderByDescending(l => l.CreatedAt).AsNoTracking();
        }
    }

    public class LoansByEstadoSpec : Specification<Loan>
    {
        public LoansByEstadoSpec(EstadoPrestamo estado)
        {
            Query
                .Include(l => l.Client)
                .Where(l => l.Estado == estado)
                .OrderByDescending(l => l.CreatedAt)
                .AsNoTracking();
        }
    }
}
