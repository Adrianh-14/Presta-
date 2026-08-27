# Backup y recuperación

La base de datos de producción debe usar snapshots cifrados y recuperación point-in-time del proveedor administrado. Las credenciales nunca se guardan en el repositorio.

## Objetivos

- RPO: 15 minutos.
- RTO: 60 minutos.
- Retención mínima: 35 días para backups diarios y 12 meses para cierres mensuales.

## Procedimiento de restauración

1. Declarar incidente y registrar el `X-Correlation-ID` de la primera alerta.
2. Restaurar una instancia aislada al punto objetivo; nunca restaurar sobre producción inicialmente.
3. Ejecutar `dotnet ef database update` con la cadena de conexión de la instancia restaurada.
4. Verificar `/health/ready`, conteos de pagos, integridad de hashes de `AuditLogs` y `JournalEntries`, y último cierre diario.
5. Ejecutar smoke tests de login, consulta de préstamo y pago idempotente.
6. Autorizar el cambio de tráfico y conservar la instancia original en solo lectura para auditoría.

## Ensayo periódico

El equipo de operaciones debe ejecutar una restauración trimestral, medir RPO/RTO, adjuntar evidencia y registrar cualquier diferencia antes de declarar el ensayo satisfactorio.
