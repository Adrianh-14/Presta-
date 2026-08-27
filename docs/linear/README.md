# Backlog de PréstamoPlus para Linear

Archivo listo para importar: `prestamoplus-backlog.csv`.

Proyecto sugerido: **PréstamoPlus — Seguridad financiera y diferenciación**.

Orden recomendado:

1. Completar todos los issues `p0` antes de operar con dinero o documentos reales.
2. Construir `ledger`, pagos seguros, doble aprobación y conciliación como un mismo hito.
3. Iniciar `Guardia de Capital` únicamente cuando sus cifras puedan derivarse del libro mayor.

El CSV usa los campos admitidos por el importador de Linear: `Title`, `Description`, `Priority`, `Status`, `Assignee`, `Created`, `Completed`, `Labels` y `Estimate`. Las dependencias se incluyen en las descripciones porque el importador CSV no garantiza relaciones bloqueado/bloqueante.

Para importarlo en Linear se requiere un administrador del workspace: **Settings → Administration → Import/Export**, opción de importación CSV/Linear.
