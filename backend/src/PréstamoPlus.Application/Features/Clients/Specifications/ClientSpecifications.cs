using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Features.Clients.Specifications
{
    public class ClientByIdWithDetailsSpec : Specification<Client>
    {
        public ClientByIdWithDetailsSpec(Guid id)
        {
            Query
                .Include(c => c.WorkInformation)
                .Include(c => c.Address)
                .Include(c => c.BankAccount)
                .Include(c => c.References)
                .Where(c => c.Id == id)
                .AsNoTracking();
        }
    }

    public class ClientByCedulaSpec : Specification<Client>
    {
        public ClientByCedulaSpec(string cedula)
        {
            Query
                .Where(c => c.Cedula == cedula)
                .AsNoTracking();
        }
    }

    public class AllClientsSpec : Specification<Client>
    {
        public AllClientsSpec(string? search = null, EstadoCliente? estado = null)
        {
            Query.Where(c => true);

            if (!string.IsNullOrWhiteSpace(search))
                Query.Where(c => c.Nombre.Contains(search) || c.Email.Contains(search) || c.Cedula.Contains(search));

            if (estado.HasValue)
                Query.Where(c => c.Estado == estado.Value);

            Query.OrderBy(c => c.Nombre).AsNoTracking();
        }
    }
}
