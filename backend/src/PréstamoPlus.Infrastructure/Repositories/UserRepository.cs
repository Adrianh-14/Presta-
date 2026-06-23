using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Interfaces;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
    }
}
