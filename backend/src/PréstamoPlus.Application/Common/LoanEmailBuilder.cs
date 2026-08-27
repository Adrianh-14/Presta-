using System.Net;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common
{
    public static class LoanEmailBuilder
    {
        public static (string Subject, string Html) Created(Loan loan, Client client, string portalUrl)
        {
            var total = loan.Installments.Sum(i => i.Cuota);
            var content = $"""
                <p style="line-height:1.6;margin:0 0 20px;">Tu préstamo fue creado correctamente. Adjuntamos el resumen y la tabla completa de amortización en formato PDF.</p>
                {Details(
                    ("Monto financiado", Money(loan.MontoOriginal)),
                    ("Tasa mensual", $"{loan.TasaInteresAnual / 12:N2}%"),
                    ("Plazo", $"{loan.PlazoMeses} meses"),
                    ("Frecuencia", loan.FrecuenciaPago.ToString()),
                    ("Cuota", Money(loan.CuotaMensual)),
                    ("Total programado", Money(total)),
                    ("Fecha de inicio", loan.FechaInicio.ToString("dd/MM/yyyy")))}
                """;

            return ("Tu préstamo fue creado", Layout(client.Nombre, "Préstamo creado", content, "#047857", portalUrl));
        }

        public static (string Subject, string Html) UpcomingPayment(
            Loan loan,
            Client client,
            Installment installment,
            string portalUrl)
        {
            var subject = $"Recordatorio: tu pago vence el {installment.FechaPago:dd/MM/yyyy}";
            var content = $"""
                <p style="line-height:1.6;margin:0 0 20px;">Tu próxima cuota vence el <strong>{installment.FechaPago:dd/MM/yyyy}</strong>.</p>
                {Details(
                    ("Número de cuota", installment.Numero.ToString()),
                    ("Monto de la cuota", Money(installment.Cuota)),
                    ("Saldo del préstamo", Money(loan.SaldoPendiente)))}
                <p style="line-height:1.6;margin:20px 0 0;">Realiza el pago a tiempo para evitar cargos de mora diarios.</p>
                """;

            return (subject, Layout(client.Nombre, "Próxima fecha de pago", content, "#d97706", portalUrl));
        }

        public static (string Subject, string Html) Mora(
            Loan loan,
            Client client,
            decimal moraPendiente,
            int diasAtraso,
            string portalUrl)
        {
            var totalCuota = loan.CuotaMensual + moraPendiente;
            var content = $"""
                <p style="line-height:1.6;margin:0 0 20px;">Tu préstamo entró en mora. La mora se genera diariamente mientras exista una cuota vencida.</p>
                {Details(
                    ("Cuota pendiente", Money(loan.CuotaMensual)),
                    ("Mora generada", Money(moraPendiente)),
                    ("Total para cubrir cuota y mora", Money(totalCuota)),
                    ("Días de atraso", diasAtraso.ToString()))}
                """;

            return ("Tu préstamo entró en mora", Layout(client.Nombre, "Préstamo en mora", content, "#b91c1c", portalUrl));
        }

        public static (string Subject, string Html) Legal(Loan loan, Client client, string portalUrl)
        {
            var content = $"""
                <p style="line-height:1.6;margin:0 0 20px;">Tu préstamo fue remitido al proceso legal. Comunícate con nosotros para recibir las instrucciones correspondientes.</p>
                {Details(("Saldo pendiente", Money(loan.SaldoPendiente)), ("Estado", "Legal"))}
                """;

            return ("Actualización importante sobre tu préstamo", Layout(client.Nombre, "Préstamo en proceso legal", content, "#7f1d1d", portalUrl));
        }

        public static (string Subject, string Html) PaymentReceived(
            Loan loan,
            Client client,
            Payment payment,
            string portalUrl)
        {
            var content = $"""
                <p style="line-height:1.6;margin:0 0 20px;">Registramos correctamente tu pago.</p>
                {Details(
                    ("Monto recibido", Money(payment.Monto)),
                    ("Capital", Money(payment.Capital)),
                    ("Interés", Money(payment.Interes)),
                    ("Mora pagada", Money(payment.MoraPagada)),
                    ("Saldo de capital", Money(payment.SaldoRestante)),
                    ("Fecha", payment.FechaPago.ToString("dd/MM/yyyy hh:mm tt")))}
                """;

            return ("Confirmación de pago recibido", Layout(client.Nombre, "Pago recibido", content, "#047857", portalUrl));
        }

        private static string Layout(string clientName, string title, string content, string accent, string portalUrl)
        {
            var name = WebUtility.HtmlEncode(clientName);
            var safePortalUrl = WebUtility.HtmlEncode(portalUrl);

            return $"""
                <!doctype html>
                <html lang="es">
                <body style="margin:0;background:#f8f9fb;font-family:Arial,sans-serif;color:#132028;">
                  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#ffffff;border:1px solid #d4e0ed;padding:32px;">
                      <div style="font-size:20px;font-weight:700;color:#0b3558;margin-bottom:28px;">PrestamoPlus</div>
                      <div style="width:48px;height:4px;background:{accent};margin-bottom:20px;"></div>
                      <h1 style="font-size:24px;margin:0 0 12px;color:#0b3558;">{title}</h1>
                      <p style="line-height:1.6;margin:0 0 16px;">Hola {name},</p>
                      {content}
                      <div style="margin-top:28px;text-align:center;">
                        <a href="{safePortalUrl}" style="display:inline-block;padding:13px 22px;background:#0b3558;color:#ffffff;text-decoration:none;font-weight:700;">Consultar mi préstamo</a>
                      </div>
                      <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#7896b5;">Este es un mensaje automático relacionado con tu préstamo.</p>
                    </div>
                  </div>
                </body>
                </html>
                """;
        }

        private static string Details(params (string Label, string Value)[] rows)
        {
            var htmlRows = string.Join(string.Empty, rows.Select(row =>
                $"<tr><td style=\"padding:12px;color:#64748b;border-bottom:1px solid #e5e7eb;\">{WebUtility.HtmlEncode(row.Label)}</td>" +
                $"<td style=\"padding:12px;text-align:right;font-weight:700;border-bottom:1px solid #e5e7eb;\">{WebUtility.HtmlEncode(row.Value)}</td></tr>"));
            return $"<table style=\"width:100%;border-collapse:collapse;background:#f8f9fb;\">{htmlRows}</table>";
        }

        private static string Money(decimal amount) => $"RD$ {amount:N2}";
    }
}
