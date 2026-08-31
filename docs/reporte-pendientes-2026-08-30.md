# Pendientes de PréstamoPlus

Fecha: 30 de agosto de 2026

Este documento contiene únicamente trabajo pendiente o que todavía requiere validación. No representa funcionalidades cerradas.

## Bloqueantes críticos

1. **Módulo de inversiones** — Pendiente de implementación. Debe registrar aportes por DOP/USD/EUR, sumar el aporte al capital disponible, calcular el rendimiento exclusivo de cada inversión, permitir retiros y conservar trazabilidad contable.
2. **Pagos de suscripción SaaS** — Falta integrar el proveedor de tarjetas en sandbox, checkout, webhooks, renovación, cancelación, período de gracia y conciliación.
3. **Pruebas físicas del lector QR** — Falta probar en Android Chrome e iOS Safari con HTTPS real: permisos, cámaras múltiples, QR válido, vencido, malformado y QR de otro tenant.
4. **OTP y correo de producción** — Falta validar dominio/remitente de Resend, entrega real, reintentos, cola durable y observabilidad. El error HTTP 500 visto durante una solicitud todavía necesita diagnóstico con logs.
5. **Migraciones formales de base de datos** — Se aplicaron columnas manualmente en el contenedor para continuar las pruebas, pero falta generar y versionar una migración formal reproducible para capital USD/EUR y contratos.

## Seguridad y protección de datos

6. **Tokens administrativos** — Migrar refresh tokens de `localStorage` a cookies `Secure`, `HttpOnly` y `SameSite`, con rotación y revocación segura.
7. **Almacenamiento de documentos** — Mover contratos, garantías, cédulas y videos desde disco local a almacenamiento privado cifrado, con URLs firmadas, antivirus, retención y borrado verificable.
8. **Verificación de correo** — Exigir confirmación del correo del administrador antes de activar definitivamente una cuenta SaaS.
9. **Cuotas del plan** — Aplicar límites reales de usuarios, clientes y préstamos al crear registros; actualmente falta verificar el bloqueo efectivo al superar cada límite.
10. **Protección operativa** — Completar WAF/CAPTCHA para formularios públicos, rotación de secretos, auditoría de accesos y revisión de permisos por rol.

## Funcionalidad pendiente

11. **Contratos** — Completar gestión avanzada: reemplazo/versionado, descarga autenticada, asociación explícita a préstamo aprobado y registro de quién subió o validó cada documento.
12. **Multimoneda contable** — Completar saldos, ingresos, gastos, pagos, cartera e intereses separados por moneda; evitar que reportes históricos mezclen DOP, USD y EUR.
13. **Panel superadministrador** — Completar gestión masiva de cortesías, fechas de inicio para nuevos tenants, retiro masivo de cortesías y métricas de facturación por período.
14. **Aprobación de solicitudes** — Validar flujo completo de propuesta modificada, aceptación por correo, expiración del enlace y transición final a préstamo sin duplicados.
15. **Recuperación ante suscripción vencida** — Completar pantalla de bloqueo, captura del método de pago y reactivación automática tras confirmación del proveedor.

## Calidad y operación

16. **Pruebas automatizadas** — Añadir cobertura para multimoneda, inversiones, contratos, cortesías masivas, suscripciones vencidas y transiciones de solicitudes.
17. **Observabilidad** — Incorporar métricas, trazas, alertas de API/cola/OTP/pagos y correlación de errores para investigar 429 y 500.
18. **Backups y recuperación** — Probar backup, restauración, rollback de migraciones y recuperación de archivos sensibles.
19. **Rendimiento frontend** — Dividir el bundle principal por rutas; actualmente continúa siendo grande para dispositivos móviles.
20. **Entorno de staging** — Definir dominio HTTPS, variables de producción, procedimiento de despliegue y checklist reproducible antes del GO.
21. **Expansión internacional de divisas** — Sustituir los selectores limitados a DOP/USD/EUR por un catálogo ISO configurable por tenant. Primera propuesta: MXN, GTQ, HNL, NIO, CRC, PAB, COP, PEN, BRL, CLP y ARS, además de las tres actuales. La activación por país requiere revisión legal, KYC/AML, fiscal y de pagos.

## Criterio para pasar a producción

No pasar a producción con datos reales hasta cerrar los puntos 1–10 y demostrar una prueba completa: registro, OTP, solicitud, garantía, contrato, aprobación, desembolso, pago QR, contabilidad por moneda, vencimiento de suscripción y restauración desde backup.
