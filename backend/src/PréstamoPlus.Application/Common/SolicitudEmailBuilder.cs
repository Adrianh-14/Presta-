using System.Net;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Common
{
    public static class SolicitudEmailBuilder
    {
        public static (string Subject, string Html) Build(
            LoanApplication solicitud,
            Client client,
            EstadoSolicitud estado,
            string? instrucciones = null,
            string? clientPortalUrl = null)
        {
            var nombre = WebUtility.HtmlEncode(client.Nombre);
            var referencia = solicitud.Id.ToString("N")[..8].ToUpperInvariant();
            var monto = solicitud.MontoSolicitado.ToString("N2");
            var instruccionesSeguras = WebUtility.HtmlEncode(instrucciones ?? string.Empty)
                .Replace("\r\n", "<br>")
                .Replace("\n", "<br>");
            var portalUrl = WebUtility.HtmlEncode(clientPortalUrl ?? "http://localhost:5173/portal/login");

            var (subject, title, message, accent) = estado switch
            {
                EstadoSolicitud.Procesando => (
                    "Tu solicitud está siendo procesada",
                    "Solicitud en revisión",
                    "Nuestro equipo comenzó a revisar la información de tu solicitud.",
                    "#006bff"),
                EstadoSolicitud.Aprobada => (
                    "Tu solicitud fue aprobada",
                    "Solicitud aprobada",
                    "Tu solicitud de préstamo fue aprobada. Nos comunicaremos contigo para los próximos pasos.",
                    "#047857"),
                EstadoSolicitud.Rechazada => (
                    "Actualización de tu solicitud",
                    "Solicitud no aprobada",
                    "Luego de revisar la información suministrada, no pudimos aprobar tu solicitud en esta ocasión.",
                    "#b91c1c"),
                EstadoSolicitud.Cancelada => (
                    "Solicitud desestimada",
                    "Solicitud desestimada",
                    "La solicitud fue cerrada por la empresa y no continuará a revisión.",
                    "#64748b"),
                _ => (
                    "Recibimos tu solicitud",
                    "Solicitud recibida",
                    "Tu solicitud está pendiente de revisión. Te notificaremos cada cambio por este correo.",
                    "#d97706")
            };

            var instructionsBlock = estado == EstadoSolicitud.Procesando && !string.IsNullOrWhiteSpace(instrucciones)
                ? $"""
                    <div style="margin:24px 0;padding:16px;border-left:4px solid #006bff;background:#eff6ff;">
                      <strong style="display:block;margin-bottom:8px;color:#0b3558;">Instrucciones para continuar</strong>
                      <span style="color:#334155;line-height:1.6;">{instruccionesSeguras}</span>
                    </div>
                    """
                : string.Empty;

            var html = $"""
                <!doctype html>
                <html lang="es">
                <body style="margin:0;background:#f8f9fb;font-family:Arial,sans-serif;color:#132028;">
                  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#ffffff;border:1px solid #d4e0ed;padding:32px;">
                      <div style="font-size:20px;font-weight:700;color:#0b3558;margin-bottom:28px;">PrestamoPlus</div>
                      <div style="width:48px;height:4px;background:{accent};margin-bottom:20px;"></div>
                      <h1 style="font-size:24px;margin:0 0 12px;color:#0b3558;">{title}</h1>
                      <p style="line-height:1.6;margin:0 0 16px;">Hola {nombre},</p>
                      <p style="line-height:1.6;margin:0;">{message}</p>
                      {instructionsBlock}
                      <table style="width:100%;margin-top:24px;border-collapse:collapse;background:#f8f9fb;">
                        <tr><td style="padding:12px;color:#64748b;">Referencia</td><td style="padding:12px;text-align:right;font-weight:700;">{referencia}</td></tr>
                        <tr><td style="padding:12px;color:#64748b;">Monto solicitado</td><td style="padding:12px;text-align:right;font-weight:700;">{WebUtility.HtmlEncode(solicitud.Moneda)} {monto}</td></tr>
                        <tr><td style="padding:12px;color:#64748b;">Estado</td><td style="padding:12px;text-align:right;font-weight:700;color:{accent};">{title}</td></tr>
                      </table>
                      <div style="margin-top:28px;text-align:center;">
                        <a href="{portalUrl}" style="display:inline-block;padding:13px 22px;background:#0b3558;color:#ffffff;text-decoration:none;font-weight:700;">Consultar mis préstamos</a>
                      </div>
                      <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#7896b5;">Este es un mensaje automático relacionado con tu solicitud.</p>
                    </div>
                  </div>
                </body>
                </html>
                """;

            return (subject, html);
        }
    }
}
