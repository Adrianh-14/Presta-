using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Features.Solicituds.Specifications
{
    public class LoanApplicationByIdWithClientSpec : Specification<LoanApplication>
    {
        public LoanApplicationByIdWithClientSpec(Guid id)
        {
            Query
                .Include(l => l.Client)
                .Include(l => l.VerificationMedia)
                .Where(l => l.Id == id)
                .AsNoTracking();
        }
    }

    public class AllLoanApplicationsWithClientSpec : Specification<LoanApplication>
    {
        public AllLoanApplicationsWithClientSpec(Guid tenantId)
        {
            Query
                .Include(l => l.Client)
                .Include(l => l.VerificationMedia)
                .Where(l => l.TenantId == tenantId)
                .OrderByDescending(l => l.FechaSolicitud)
                .AsNoTracking();
        }
    }

    public class LoanApplicationsByClientIdSpec : Specification<LoanApplication>
    {
        public LoanApplicationsByClientIdSpec(Guid clientId)
        {
            Query
                .Include(l => l.Client)
                .Where(l => l.ClientId == clientId)
                .OrderByDescending(l => l.FechaSolicitud)
                .AsNoTracking();
        }
    }

    public class LoanApplicationsByEstadoSpec : Specification<LoanApplication>
    {
        public LoanApplicationsByEstadoSpec(Domain.Enums.EstadoSolicitud estado)
        {
            Query
                .Include(l => l.Client)
                .Where(l => l.Estado == estado)
                .OrderByDescending(l => l.FechaSolicitud)
                .AsNoTracking();
        }
    }
}
