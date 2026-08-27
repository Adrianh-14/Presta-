using System.Net;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common
{
    public static class ClientEmailBuilder
    {
        public static (string Subject, string Html) Registered(Client client, string portalUrl)
        {
            var name = WebUtility.HtmlEncode(client.Nombre);
            var safePortalUrl = WebUtility.HtmlEncode(portalUrl);
            var html = $"""
                <!doctype html>
                <html lang="es">
                <body style="margin:0;background:#f8f9fb;font-family:Arial,sans-serif;color:#132028;">
                  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#fff;border:1px solid #d4e0ed;padding:32px;">
                      <div style="font-size:20px;font-weight:700;color:#0b3558;margin-bottom:28px;">PrestamoPlus</div>
                      <div style="width:48px;height:4px;background:#006bff;margin-bottom:20px;"></div>
                      <h1 style="font-size:24px;margin:0 0 12px;color:#0b3558;">Registro completado</h1>
                      <p style="line-height:1.6;">Hola {name}, recibimos correctamente tus datos y tu registro como cliente fue completado.</p>
                      <p style="line-height:1.6;">Te notificaremos por este correo cuando se cree un préstamo o cambie el estado de una solicitud.</p>
                      <div style="margin-top:28px;text-align:center;">
                        <a href="{safePortalUrl}" style="display:inline-block;padding:13px 22px;background:#0b3558;color:#fff;text-decoration:none;font-weight:700;">Ir al portal</a>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
                """;
            return ("Tu registro en PrestamoPlus fue completado", html);
        }
    }
}
