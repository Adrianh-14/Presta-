# Entrega de correo de Bonexa

Bonexa envía los correos transaccionales mediante Resend. El código exige que los despliegues de producción usen un remitente de un dominio propio verificado; `onboarding@resend.dev` queda reservado para pruebas locales.

## Configuración obligatoria en Resend y DNS

1. Agrega el dominio o subdominio transaccional en Resend, por ejemplo `correo.tudominio.com`.
2. Publica exactamente los registros SPF y DKIM que muestra Resend para ese dominio.
3. Publica un registro DMARC en `_dmarc.tudominio.com`. Para iniciar el monitoreo puede usarse `v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com`; después de revisar los reportes se puede endurecer a `quarantine` o `reject`.
4. Espera la propagación DNS y confirma el estado `Verified` en Resend antes de enviar a clientes.
5. Usa en Dokploy un `RESEND_FROM_EMAIL` perteneciente al dominio verificado, un `RESEND_REPLY_TO_EMAIL` atendido y una `RESEND_CLIENT_PORTAL_URL` pública con HTTPS.

Ejemplo de variables protegidas en Dokploy:

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notificaciones@correo.tudominio.com
RESEND_FROM_NAME=Bonexa
RESEND_REPLY_TO_EMAIL=soporte@tudominio.com
RESEND_CLIENT_PORTAL_URL=https://app.tudominio.com/portal/login
```

La aplicación envía `Reply-To` cuando está configurado y bloquea el arranque fuera de Development si se intenta usar `resend.dev` o una URL HTTP/local. Esto evita desplegar una configuración que los proveedores de correo consideren poco confiable.

## Diagnóstico después del deploy

- En Resend, revisar eventos `delivered`, `bounced`, `complained` y `suppressed`.
- En Gmail o Outlook, abrir “Mostrar original” y confirmar SPF, DKIM y DMARC con resultado `PASS`.
- Probar primero con cuentas controladas de Gmail, Outlook y un dominio corporativo; no enviar lotes grandes de inmediato.
- No reutilizar direcciones rebotadas ni destinatarios que hayan marcado el mensaje como spam.
