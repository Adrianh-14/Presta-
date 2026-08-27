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

        public async Task<Client?> GetByCedulaAsync(string cedula, Guid tenantId)
        {
            return await _context.Clients
                .Include(c => c.WorkInformation)
                .Include(c => c.Address)
                .Include(c => c.BankAccount)
                .Include(c => c.References)
                .FirstOrDefaultAsync(c => c.Cedula == cedula && c.TenantId == tenantId);
        }
    }
}
