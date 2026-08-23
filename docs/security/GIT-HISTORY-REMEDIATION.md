# Historial de Git saneado

Saneamiento ejecutado el 2026-08-23 con autorización explícita del propietario del repositorio.

## Resultado verificado

- `origin/main` fue reemplazado usando `--force-with-lease`, desde `16f3cceb848ba7fd4ea7e8cc2930923a6e340632` hasta `96605192505de111ffb7faae3a56e83acf05e5c7`.
- Los 11 commits alcanzables fueron revisados: 0 contienen la antigua contraseña de PostgreSQL y 0 contienen el antiguo secreto JWT.
- No quedan objetos alcanzables para fotos o videos en `backend/uploads`.
- `git fsck --full --no-reflogs` terminó sin incidencias.
- El contenido local se verificó antes y después de realinear `main`: 227 archivos comparados por SHA-256 y 0 alteraciones.
- Las referencias internas de recuperación que conservaban snapshots sensibles fueron eliminadas después de verificar los archivos actuales.

Los colaboradores con clones anteriores al saneamiento deben volver a clonar o eliminar todas las referencias antiguas antes de publicar cambios. Los forks, respaldos y artefactos externos deben revisarse por separado porque no están bajo el control del repositorio local.
