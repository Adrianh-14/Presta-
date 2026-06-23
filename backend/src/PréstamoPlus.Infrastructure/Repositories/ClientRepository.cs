using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Repositories
{
    public class ClientRepository : GenericRepository<Client>, IClientRepository
    {
        private readonly ApplicationDbContext _context;

        public ClientRepository(ApplicationDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Client?> GetByCedulaAsync(string cedula)
        {
            return await _context.Clients.FirstOrDefaultAsync(c => c.Cedula == cedula);
        }
    }
}
