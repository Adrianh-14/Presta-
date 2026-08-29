namespace PréstamoPlus.Domain.Entities
{
    public class VerificationMedia
    {
        public Guid Id { get; set; }
        public Guid? LoanApplicationId { get; set; }
        public Guid? ClientId { get; set; }
        public string? VideoPath { get; set; }
        public string? FotoCedulaPath { get; set; }
        public string? GarantiaPath { get; set; }
        public string? ContratoPath { get; set; }

        public LoanApplication? LoanApplication { get; set; }
        public Client? Client { get; set; }
    }
}
