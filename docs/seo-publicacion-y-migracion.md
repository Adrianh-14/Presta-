# SEO: publicación, medición y cambio de dominio

Revisión: 14 de octubre de 2026.

## Cambios implementados

- La portada conserva el componente `Landing` y se prerenderiza a HTML completo durante el build. Se hidrata con un bundle separado de la aplicación privada.
- Nginx sirve esa portada estática. Las rutas de administración, registro, inicio de sesión y portal mantienen el shell de la aplicación con `noindex,follow`.
- El sitemap publica 23 páginas. Robots permite rastrear las páginas públicas y leer el `noindex` de los shells; el control de acceso sigue correspondiendo a la aplicación y la API.
- Las cinco páginas comerciales incorporan encabezados específicos, un flujo de uso, una captura y preguntas frecuentes diferenciadas.
- La portada enlaza páginas comerciales, recursos, condiciones gratuitas, seguridad y contacto.
- Las tres guías incluyen ejemplos, instrucciones y enlaces relacionados. Se añaden dos plantillas CSV vacías para preparar cartera y seguimiento.
- La calculadora de portada tiene entradas reales, validación y cuota fija sobre saldo. Se corrigió también la equivalencia de períodos semanales de la calculadora estática: 52 por año, no 48.
- Se publica el correo `adrien1138@gmail.com` y WhatsApp `+1 829 690 8175`, autorizados por el propietario.
- Se explican los límites iniciales que figuran en `PlanDefinitions` y `TenantRegistrationService`: 100 clientes, 50 préstamos activos y 3 usuarios; cuenta inicial gratuita. No se modifica la política de suscripciones.
- Imagen social local de 1200 × 630, datos estructurados sin reseñas inventadas, compresión y caché de assets con hash.

## Verificación reproducible

```sh
npm run build:all
npm run marketing:verify
```

El verificador comprueba las 23 páginas: H1 único, canonical correcto, indexabilidad, JSON-LD válido, existencia de enlaces y assets locales, enlaces principales de portada, datos de contacto, prerender, noindex de shells privados y casos de cálculo. Impone un presupuesto de 100 KB gzip para el JavaScript inicial de portada.

El Dockerfile ejecuta el build y el verificador antes de crear la imagen. No se incluyen las carpetas de adjuntos locales en el repositorio.

Después del despliegue, comprobar `/`, `/robots.txt`, `/sitemap.xml`, `/branding/social-card.png`, `/app-showcase/admin-dashboard.jpg`, una guía y un enlace de registro. El código fuente HTTP de `/` debe contener el H1 y el texto comercial sin ejecutar JavaScript. Verificar también que una URL inexistente devuelve 404 y que la calculadora y la galería funcionan en móvil.

La reducción de peso del bundle no sustituye una medición real de LCP, INP y CLS. Realizar PageSpeed Insights sobre producción después del despliegue y contrastar con datos de campo cuando existan.

## Search Console y medición

El propietario confirmó que tiene acceso a Search Console. Esta tarea no conecta ni modifica su propiedad.

1. Mantener verificada la propiedad del dominio actual. Preferir verificación DNS cuando se gestione el dominio.
2. Enviar `/sitemap.xml` e inspeccionar `/` y las cinco páginas comerciales. Solicitar indexación después de comprobar el HTML desplegado.
3. Revisar indexación, canonical elegido por Google, errores de rastreo y Core Web Vitals.
4. Guardar una línea base de los últimos 28 días: impresiones, clics, CTR y posición por consulta y página; segmentar República Dominicana y móvil. Comparar períodos equivalentes.
5. Separar búsquedas de marca de búsquedas comerciales. Medir registros completados por origen con una integración aprobada, no asumir que un clic equivale a un registro.

`GOOGLE_SITE_VERIFICATION` es un argumento opcional de build en Docker Compose; permite insertar la etiqueta de verificación HTML sin editar plantillas. No hace falta si la propiedad ya está verificada por DNS. No introducir contraseñas ni tokens privados.

`marketing/measurement.js` emite el evento local `bonexa:marketing` con `{name, page}` para clics de registro, correo, WhatsApp y descargas. No transmite datos, no instala cookies y no equivale a una integración de analítica activa. Una integración posterior puede escuchar este evento de acuerdo con la configuración de privacidad que se apruebe. No recopilar nombres, saldos, teléfonos de clientes ni parámetros de solicitudes.

## Migración de dominio: preparada, no activada

Falta el dominio definitivo. No cambiar `SITE_URL` en producción antes de que el dominio nuevo tenga DNS, HTTPS, despliegue y propiedad verificada en Search Console.

1. Verificar las propiedades antigua y nueva y conservar acceso a ambas.
2. Configurar `SITE_URL=https://dominio-definitivo` como argumento de build y reconstruir. Los canonical, sitemap, hreflang y URLs de metadatos públicos usarán ese origen. Mantener las rutas actuales siempre que sea posible.
3. Revisar autenticación, cookies, CORS, correos, enlaces de portal y cualquier callback del backend de forma independiente: cambiar el origen SEO no migra esos servicios.
4. Configurar redirecciones permanentes del dominio antiguo al nuevo, conservando ruta y consulta para cada URL equivalente. Evitar redirigir todas las páginas a la portada. Comprobar que no haya cadenas ni bucles.
5. Enviar el sitemap nuevo y utilizar el cambio de dirección de Search Console cuando corresponda. Actualizar enlaces de perfiles y materiales propios.
6. Mantener las redirecciones al menos un año y seguir los errores, el tráfico de ambos dominios y los canonical elegidos. No prometer que las posiciones se conservan sin fluctuaciones.

Fuentes: [Google: migración con cambios de URL](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Google: comenzar con Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start).

## Acciones que no puede reemplazar el código

- Identificar al responsable o empresa y publicar condiciones legales y de privacidad verificadas. El usuario todavía no proporcionó la identidad legal; no se inventó una razón social, dirección, certificación ni plazo de soporte.
- Obtener testimonios y casos de clientes con autorización. No se publican cifras de recuperación ni opiniones ficticias.
- Conseguir menciones y enlaces legítimos mediante usuarios, asociaciones y directorios pertinentes. No se enviaron mensajes ni se contrataron enlaces.
- Conectar la medición de registros completados y revisar Search Console. No hay una integración de analítica externa activa por este cambio.
- Ejecutar el despliegue de producción y las comprobaciones de campo. No se garantiza una posición en Google ni una fecha de indexación.
