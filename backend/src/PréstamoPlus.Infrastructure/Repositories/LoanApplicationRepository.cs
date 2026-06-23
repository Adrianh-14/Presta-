using Ardalis.Specification;
using Ardalis.Specification.EntityFrameworkCore;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Repositories
{
    public class LoanApplicationRepository : RepositoryBase<LoanApplication>, ILoanApplicationRepository
    {
        public LoanApplicationRepository(ApplicationDbContext context) : base(context) { }
    }
}
