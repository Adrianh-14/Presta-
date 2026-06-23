using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Domain.Interfaces
{
    public interface IUserRepository : IRepositoryBase<User>
    {
        Task<User?> GetByEmailAsync(string email);
    }
}
