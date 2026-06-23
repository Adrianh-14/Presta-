using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Domain.Interfaces
{
    public interface IClientRepository : IRepositoryBase<Client>
    {
        Task<Client?> GetByCedulaAsync(string cedula);
    }
}
