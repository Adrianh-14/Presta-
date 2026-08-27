# Gobierno de datos y expediente del cliente

## Principios

- Cada registro pertenece a un único `TenantId`; nunca se usa la cédula como identificador global.
- El acceso a PII y documentos KYC requiere una política explícita (`ReadPii`) y queda sujeto a auditoría.
- Los documentos se sirven únicamente mediante el endpoint autorizado de medios; no se publican como archivos estáticos.
- Las respuestas de autenticación no confirman si una cédula existe.

## Consentimiento

El flujo de registro debe conservar evidencia del consentimiento informado para tratamiento de datos, comunicaciones y evaluación crediticia. La referencia de consentimiento debe vincularse al cliente o solicitud y no debe contener documentos ni secretos.

## Retención

| Dato | Retención recomendada | Disposición |
|---|---:|---|
| Solicitudes y contratos | Vigencia + 10 años | Archivado y eliminación segura al vencer |
| Movimientos financieros | Vigencia + 10 años | Conservación regulatoria; acceso restringido |
| OTP y sesiones | Máximo 90 días | Purga automática |
| Documentos KYC | Vigencia + 5 años | Borrado seguro y registro de auditoría |
| Logs operativos | 12 meses | Rotación controlada |

Los plazos son configurables por política legal del negocio. La eliminación nunca debe borrar la bitácora de auditoría; se registra una disposición sin incluir el contenido eliminado.

## Solicitudes de titulares

Las solicitudes de acceso, rectificación o eliminación deben verificarse con autenticación reforzada, ejecutarse dentro del tenant correcto y dejar evidencia en `AuditLogs`. No se atienden solicitudes basadas únicamente en una cédula enviada por el cliente.

## Revisión

El responsable técnico y el responsable del negocio revisan esta política al menos anualmente y antes de operar con datos reales.
