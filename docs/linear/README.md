# Backlog de PréstamoPlus para Linear

Archivo listo para importar: `prestamoplus-backlog.csv`.

Proyecto sugerido: **PréstamoPlus — Seguridad financiera y diferenciación**.

Orden recomendado:

1. Completar todos los issues `p0` antes de operar con dinero o documentos reales.
2. Construir `ledger`, pagos seguros, doble aprobación y conciliación como un mismo hito.
3. Iniciar `Guardia de Capital` únicamente cuando sus cifras puedan derivarse del libro mayor.

El CSV usa los campos admitidos por el importador de Linear: `Title`, `Description`, `Priority`, `Status`, `Assignee`, `Created`, `Completed`, `Labels` y `Estimate`. Las dependencias se incluyen en las descripciones porque el importador CSV no garantiza relaciones bloqueado/bloqueante.

Para importarlo en Linear se requiere un administrador del workspace: **Settings → Administration → Import/Export**, opción de importación CSV/Linear.

## Bloqueantes de preproducción agregados — 2026-08-28

| # | Bloqueante | Tarea del backlog |
|---|---|---|
| 1 | Prueba física del cobro QR en Android/iOS y HTTPS final | `[P0] Certificar cobro QR móvil en staging HTTPS` |
| 2 | Docker/PostgreSQL/API y ensayo de despliegue no saludables | `[P0] Recuperar entorno y ensayar despliegue completo` |
| 3 | Checkout, cobro recurrente y ciclo de suscripción pendientes | `[P1] Integrar facturación SaaS en sandbox` |
| 4 | Autoregistro sin verificación de correo ni recuperación segura | `[P0] Verificar correo y recuperar acceso del administrador` |
| 5 | Refresh token legible por JavaScript | `[P0] Modernizar sesiones, accesibilidad y experiencia móvil` |
| 6 | Cédulas y vídeos almacenados en disco local | `[P0] Privatizar documentos KYC y endurecer carga/descarga de archivos` |
| 7 | Límites de planes informativos pero no exigidos | `[P0] Exigir cuotas y entitlements antes de cada escritura` |
| 8 | Entrega OTP sin certificación externa ni cola durable | `[P0] Certificar entrega OTP y recuperación de acceso` |
| 9 | Bundle móvil por encima del presupuesto | `[P0] Modernizar sesiones, accesibilidad y experiencia móvil` |
| 10 | Backups, restauración, observabilidad, WAF y carga sin evidencia | `[P0] Añadir backups, recuperación, observabilidad y jobs resilientes` y `[P1] Proteger formularios públicos contra abuso` |

No se debe cambiar el estado de salida a **GO** mientras quede abierta cualquiera de las tareas P0 anteriores.
