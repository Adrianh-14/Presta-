using Ardalis.Specification.EntityFrameworkCore;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Repositories
{
    public class GenericRepository<T> : RepositoryBase<T> where T : class
    {
        public GenericRepository(ApplicationDbContext context) : base(context) { }
    }
}
