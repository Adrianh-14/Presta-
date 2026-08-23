# Aprobación para operar con datos y dinero reales

Estado inicial: **BLOQUEADO**.

PréstamoPlus no inicia fuera de `Development` hasta que se cumplan todos los puntos, se firme esta aprobación y se configuren `Security__RealDataApproved=true` y `Security__ReleaseApprovalReference` con la referencia de la aprobación.

## Controles obligatorios

- [x] Se rotaron la contraseña de PostgreSQL, el secreto JWT y las credenciales locales que estuvieron versionadas.
- [x] Los nuevos secretos viven en variables protegidas o en un gestor de secretos; no aparecen en archivos, logs ni historial de Git alcanzable.
- [ ] `DemoData__Enabled=false` y no existen usuarios demo en la base productiva.
- [x] No existen fotos de cédula, videos, contratos ni otros documentos reales dentro del repositorio o su historial alcanzable.
- [x] Se invalidaron los JWT emitidos con el secreto anterior.
- [ ] Se verificó una restauración reciente del backup de PostgreSQL.
- [ ] Se ejecutaron las pruebas de autenticación, autorización, aislamiento de tenant y movimientos financieros requeridas para la salida.
- [ ] Seguridad y el responsable del negocio aceptaron el riesgo residual documentado.

## Firma

Responsable técnico: ______________________________

Responsable del negocio: ___________________________

Fecha (UTC): ______________________________________

Referencia de aprobación: __________________________

Observaciones: ____________________________________

La referencia firmada debe almacenarse fuera del repositorio si contiene datos personales o firmas digitales.
