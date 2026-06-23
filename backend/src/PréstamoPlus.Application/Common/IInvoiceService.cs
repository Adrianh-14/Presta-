namespace PréstamoPlus.Application.Common
{
    public interface IInvoiceService
    {
        Task<Domain.Entities.Invoice> GeneratePdfAsync(Guid loanId);
        Task SendInvoiceAsync(Guid invoiceId);
    }
}
