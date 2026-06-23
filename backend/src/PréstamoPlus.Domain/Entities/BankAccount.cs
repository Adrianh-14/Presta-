namespace PréstamoPlus.Domain.Entities
{
    public class BankAccount
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        public string Banco { get; set; } = string.Empty;
        public Enums.TipoCuentaBancaria TipoCuenta { get; set; }
        public string NumeroCuenta { get; set; } = string.Empty;

        public Client Client { get; set; } = null!;
    }
}
