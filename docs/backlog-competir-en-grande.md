# Backlog competitivo de PréstamoPlus

Objetivo: llevar PréstamoPlus de una plataforma funcional para RD a una solución de referencia para prestamistas y pequeñas financieras de República Dominicana y Latinoamérica.

## Resultado esperado

- 0–30 días: base SEO medible, conversión y confianza comercial.
- 31–60 días: automatización que nos diferencie de Credi y PrestaCRM.
- 61–90 días: operación móvil/offline y expansión regional.
- 90+ días: integraciones, cumplimiento y escala enterprise.

## Frente 1 — SEO, demanda y marca

### PP-SEO-01 — Medición SEO inicial

- Prioridad: P0
- Responsable: Growth/SEO
- Estimación: 2 días
- Dependencias: dominio de producción
- Entrega: Search Console, Analytics, eventos de registro y dashboard de conversiones.
- Aceptación: se pueden medir impresiones, clics, registros, inicio de solicitud y activación del primer préstamo.

### PP-SEO-02 — Clúster de páginas por intención

- Prioridad: P0
- Responsable: Content + SEO
- Estimación: 5 días
- Entrega: páginas para `sistema de préstamos RD`, `software para prestamistas`, `sistema de cobranza`, `app para cobradores`, `gestión de cartera` y `préstamos multimoneda`.
- Aceptación: cada página tiene intención única, title, description, canonical, FAQ y CTA a comenzar.

### PP-SEO-03 — Páginas regionales y por moneda

- Prioridad: P1
- Responsable: Content + Producto
- Estimación: 8 días
- Entrega: páginas para República Dominicana, México, Colombia, Panamá, Guatemala, Honduras, Nicaragua, Costa Rica, Perú, Chile, Argentina, Brasil, Canadá y Reino Unido; enlazadas desde multimoneda.
- Aceptación: no hay contenido duplicado; cada página explica moneda, operación y caso de uso local.

### PP-SEO-04 — Biblioteca de recursos y video demos

- Prioridad: P1
- Responsable: Content + Customer Success
- Estimación: 10 días
- Entrega: 12 artículos y 6 videos: cliente, préstamo, cuota, cobranza, cobrador y multimoneda.
- Aceptación: cada recurso enlaza a una función del producto y a registro; se publica una pieza semanal.

### PP-GROWTH-01 — Prueba social y casos de éxito

- Prioridad: P0
- Responsable: Marketing/Ventas
- Estimación: 7 días
- Entrega: 3 testimonios verificables, 2 casos de uso dominicanos, logos autorizados y métricas reales.
- Aceptación: ningún número publicado es estimado; cada testimonio tiene autorización del cliente.

## Frente 2 — Producto que gana la comparación

### PP-AUTO-01 — WhatsApp transaccional

- Prioridad: P0
- Responsable: Backend + Integraciones
- Estimación: 10 días
- Entrega: recordatorio previo, aviso de vencimiento, aviso de mora y recibo digital por WhatsApp.
- Aceptación: plantillas auditables, opt-in, reintentos, registro de entrega y apagado por empresa.

### PP-AUTO-02 — Importación desde Excel/CSV

- Prioridad: P0
- Responsable: Full-stack
- Estimación: 7 días
- Entrega: asistente para mapear clientes, préstamos, saldos y cuotas con vista previa y validación.
- Aceptación: importación reversible, errores por fila, resumen de registros y auditoría.

### PP-RISK-01 — Scoring configurable por reglas

- Prioridad: P1
- Responsable: Producto + Backend
- Estimación: 12 días
- Entrega: reglas de ingresos, antigüedad, mora, referencias y garantías; resultado Verde/Amarillo/Rojo explicable.
- Aceptación: cada decisión muestra variables y versión de regla; no se presenta como IA sin validación.

### PP-REPORT-01 — Indicadores de cartera PAR30/PAR60/PAR90

- Prioridad: P0
- Responsable: Backend + Data
- Estimación: 6 días
- Entrega: mora por tramo, recuperación, aging, cartera por moneda, cobrador y sucursal.
- Aceptación: cifras conciliadas con pagos y exportables a CSV/PDF.

### PP-PAY-01 — Integraciones de pago regionales

- Prioridad: P1
- Responsable: Integraciones + Seguridad
- Estimación: 15 días por proveedor
- Entrega: primer proveedor local RD y una opción internacional; conciliación automática y webhook idempotente.
- Aceptación: pagos nunca mezclan moneda, tenant ni préstamo; eventos auditados.

## Frente 3 — Cobradores y operación móvil

### PP-MOBILE-01 — Modo offline para cobradores

- Prioridad: P0
- Responsable: Frontend móvil + Backend
- Estimación: 15 días
- Entrega: cartera del día, visitas y cobros sin conexión; cola local y sincronización segura.
- Aceptación: conflictos visibles, reintento idempotente y datos sensibles protegidos localmente.

### PP-MOBILE-02 — Rutas y priorización de cobranza

- Prioridad: P1
- Responsable: Producto + Frontend
- Estimación: 8 días
- Entrega: lista priorizada por vencimiento, monto, días de mora y zona; mapa opcional con consentimiento.
- Aceptación: el cobrador sabe qué hacer hoy en menos de tres interacciones.

### PP-TRUST-01 — Portal de cliente reforzado

- Prioridad: P1
- Responsable: Frontend + Seguridad
- Estimación: 7 días
- Entrega: estado de cuenta, recibos, contrato, pagos y solicitudes de soporte.
- Aceptación: acceso seguro, expiración de sesión y separación estricta por empresa.

## Frente 4 — Confianza, cumplimiento y escala

### PP-SEC-01 — Paquete de seguridad y cumplimiento

- Prioridad: P0
- Responsable: Seguridad + Backend
- Estimación: 10 días
- Entrega: política de privacidad, retención, exportación/eliminación, backups verificados, registro de accesos y matriz de permisos.
- Aceptación: checklist firmado, prueba de restauración y evidencia de aislamiento multiempresa.

### PP-API-01 — API pública y webhooks

- Prioridad: P1
- Responsable: Backend
- Estimación: 15 días
- Entrega: documentación OpenAPI, claves por empresa, webhooks de préstamo/pago/mora y límites de uso.
- Aceptación: versionado, revocación, firma de webhook y logs sin datos sensibles.

### PP-OPS-01 — Preparación multi-país

- Prioridad: P1
- Responsable: Producto + Legal + Finanzas
- Estimación: 12 días
- Entrega: configuración de zona horaria, formato fiscal, idioma, moneda, feriados y reglas de mora por país.
- Aceptación: agregar un país no requiere alterar lógica específica de RD.

## Orden de ejecución recomendado

1. PP-SEO-01, PP-SEO-02, PP-GROWTH-01, PP-REPORT-01.
2. PP-AUTO-01, PP-AUTO-02 y PP-SEC-01.
3. PP-MOBILE-01, PP-MOBILE-02 y PP-RISK-01.
4. PP-PAY-01, PP-API-01 y PP-OPS-01.

## Frente responsable

- **Producto:** priorización, entrevistas, métricas y definición de reglas.
- **Frontend:** experiencia, portal, móvil y accesibilidad.
- **Backend:** cartera, automatizaciones, pagos, API y auditoría.
- **SEO/Contenido:** páginas, clústeres, enlaces, schema y distribución.
- **Growth/Ventas:** casos de éxito, demos, onboarding y conversión.
- **Seguridad/Legal:** privacidad, consentimiento, backups, permisos y cumplimiento regional.

## Hasta dónde nos llevan estos cambios

- Con P0 completado: PréstamoPlus puede competir frontalmente por prestamistas y pequeñas financieras en RD.
- Con P0 + P1 de móvil/automatización: pasa a ser una alternativa claramente diferenciada frente a Credi y PrestaCRM.
- Con API, pagos regionales y multi-país: queda preparada para competir por operaciones latinoamericanas más grandes.
- No garantiza posiciones de Google por sí solo: la autoridad del dominio, enlaces, publicación constante y pruebas reales seguirán determinando el ranking.
