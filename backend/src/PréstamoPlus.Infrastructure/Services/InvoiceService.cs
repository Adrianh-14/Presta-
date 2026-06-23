using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PréstamoPlus.Application.Common;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Infrastructure.Persistence;

namespace PréstamoPlus.Infrastructure.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoiceService> _logger;

        public InvoiceService(ApplicationDbContext context, ILogger<InvoiceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Invoice> GeneratePdfAsync(Guid loanId)
        {
            var loan = await _context.Loans
                .Include(l => l.Client)
                .FirstOrDefaultAsync(l => l.Id == loanId)
                ?? throw new InvalidOperationException("Préstamo no encontrado.");

            var invoiceCount = await _context.Invoices.CountAsync(i => i.TenantId == loan.TenantId);
            var numero = $"INV-{DateTime.UtcNow:yyyyMM}-{(invoiceCount + 1):D5}";

            var subtotal = loan.MontoOriginal;
            var moraTotal = await _context.LateFees
                .Where(lf => lf.LoanId == loanId && !lf.Pagado)
                .SumAsync(lf => lf.Monto);
            var total = subtotal + moraTotal;

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                TenantId = loan.TenantId,
                LoanId = loanId,
                Numero = numero,
                Fecha = DateTime.UtcNow,
                Subtotal = subtotal,
                MoraTotal = moraTotal,
                Total = total
            };

            var html = GenerateInvoiceHtml(invoice, loan);
            var pdfPath = Path.Combine("invoices", $"{numero}.html");
            var directory = Path.GetDirectoryName(pdfPath);
            if (directory != null && !Directory.Exists(directory))
                Directory.CreateDirectory(directory);
            await File.WriteAllTextAsync(pdfPath, html, Encoding.UTF8);

            invoice.PdfPath = pdfPath;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Factura {Numero} generada para préstamo {LoanId}.", numero, loanId);
            return invoice;
        }

        public async Task SendInvoiceAsync(Guid invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Loan)
                    .ThenInclude(l => l.Client)
                .FirstOrDefaultAsync(i => i.Id == invoiceId)
                ?? throw new InvalidOperationException("Factura no encontrada.");

            invoice.EnviadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Factura {Numero} marcada como enviada al cliente {ClientName}.",
                invoice.Numero,
                invoice.Loan?.Client?.Nombre ?? "N/A");
        }

        private static string GenerateInvoiceHtml(Invoice invoice, Loan loan)
        {
            return $"""
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"><title>Factura {invoice.Numero}</title></head>
                <body>
                    <h1>Factura {invoice.Numero}</h1>
                    <p><strong>Fecha:</strong> {invoice.Fecha:dd/MM/yyyy}</p>
                    <p><strong>Cliente:</strong> {loan.Client?.Nombre ?? "N/A"}</p>
                    <p><strong>Préstamo ID:</strong> {loan.Id}</p>
                    <hr>
                    <table>
                        <tr><td>Subtotal</td><td>{invoice.Subtotal.ToString("C", CultureInfo.GetCultureInfo("es-DO"))}</td></tr>
                        <tr><td>Mora</td><td>{invoice.MoraTotal.ToString("C", CultureInfo.GetCultureInfo("es-DO"))}</td></tr>
                        <tr><td><strong>Total</strong></td><td><strong>{invoice.Total.ToString("C", CultureInfo.GetCultureInfo("es-DO"))}</strong></td></tr>
                    </table>
                </body>
                </html>
                """;
        }
    }
}
