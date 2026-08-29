# Reporte de evaluación preproducción — PréstamoPlus

Fecha: 28 de agosto de 2026  
Veredicto: **NO-GO temporal para datos reales**

## Resumen ejecutivo

Se reparó la causa de software que mostraba el error genérico de HTTPS/cámara en el lector QR, se cerró una redirección insegura desde QR externos, se habilitó la política de cámara del backend y se creó el alta autónoma SaaS. También se renovaron las superficies principales del frontend con una identidad financiera sobria y un shell administrativo adaptable a móvil.

La solución compila, el lint termina sin advertencias, las 14 pruebas automatizadas pasan y las auditorías de npm y NuGet no reportan vulnerabilidades conocidas. Aun así, no debe publicarse con datos reales hasta completar los bloqueantes indicados abajo.

## Trabajo completado

### Lector QR móvil

- Corregido el acceso al elemento de vídeo antes de que React lo montara; ese `null` se reportaba erróneamente como fallo de HTTPS.
- El `<video>` permanece montado antes de solicitar la cámara.
- Selección progresiva de cámara trasera con fallback a cualquier cámara disponible.
- Mensajes diferenciados para contexto inseguro, permiso denegado, cámara inexistente y cámara ocupada.
- Fallback entre `BarcodeDetector` y `jsQR`.
- Lectura limitada a 8 fotogramas por segundo aproximadamente para reducir consumo y calentamiento móvil.
- Solo se aceptan tokens internos hexadecimales de 64 caracteres.
- Todo QR se normaliza al origen actual; se eliminó la redirección abierta a una URL arbitraria.
- La cabecera `Permissions-Policy` cambió de `camera=()` a `camera=(self)`.

### Autoregistro SaaS

- Nueva ruta pública `/registro` y endpoint `POST /api/auth/tenant-register`.
- Alta transaccional de empresa, administrador, configuración, suscripción Basic en prueba de 14 días y refresh token.
- Aislamiento por `TenantId`, slug único, correo global único y control de RNC duplicado.
- Límite de 5 altas por IP por hora.
- Contraseñas PBKDF2-SHA256 versionadas con 210 000 iteraciones y comparación en tiempo constante.
- Compatibilidad de acceso con hashes antiguos.
- Login y renovación de token bloquean empresa inactiva, suscripción cancelada o período vencido.

### Seguridad

- Formularios públicos limitados a 10 solicitudes por IP/hora y 25 MB por petición.
- Un formulario público ya no puede sobrescribir la información personal de un cliente existente por cédula.
- Los formularios solo aceptan tenants activos con suscripción vigente.
- CSP y Cross-Origin-Opener-Policy añadidas para producción.
- Límites de planes alineados con `PlanDefinitions` como fuente única.
- React Router actualizado a una versión corregida.
- SQLite nativo transitivo actualizado para cerrar GHSA-2m69-gcr7-jv3q.
- OTP: los rechazos de Resend ahora producen error real y se reintentan hasta tres veces; antes se descartaban silenciosamente.

### Frontend

- Nueva dirección visual: azul tinta, papel frío, verde de conciliación, Manrope para títulos, Inter para contenido e IBM Plex Mono para datos.
- Login profesional con jerarquía financiera y acceso visible al registro autónomo.
- Registro responsivo de empresa/administrador, reglas de contraseña y términos.
- Navegación administrativa convertida a sidebar financiero de escritorio y drawer móvil.
- Dashboard con encabezado ejecutivo y mejor jerarquía.
- Lector QR reorganizado para uso con una mano, mensajes accesibles y estado de seguridad visible.
- Advertencias preexistentes de hooks corregidas; lint termina limpio.

## Evidencia de verificación

- `npm run build`: correcto.
- `npm run lint`: correcto, 0 errores y 0 advertencias.
- `npm audit`: 0 vulnerabilidades.
- `dotnet build`: correcto, 0 errores y 0 advertencias.
- `dotnet test`: 14/14 pruebas correctas.
- `dotnet list package --vulnerable --include-transitive`: 0 paquetes vulnerables en las fuentes actuales.
- Rutas `/login`, `/registro` y `/portal/pago-qr`: HTTP 200 con Vite.
- Frontend queda ejecutándose en `http://localhost:5173`.

## Bloqueantes para producción

1. **Prueba física QR pendiente.** Debe validarse en Android Chrome y iOS Safari bajo el dominio HTTPS final: permitir, denegar y volver a permitir cámara; dispositivo con varias cámaras; QR válido, vencido, malformado y de otro origen. El navegador automatizado no estuvo disponible en esta sesión.
2. **Infraestructura local no saludable.** Docker Desktop no expone el motor aunque su WSL interno inicia; PostgreSQL y la API no pudieron quedar levantados. El frontend sí está activo. Hay que recuperar Docker o probar en el entorno de despliegue antes de una aprobación.
3. **Pago de suscripción no integrado.** El trial funciona, pero falta checkout, webhooks, renovación, gracia, cancelación y conciliación con el proveedor sandbox que se seleccionará.
4. **Verificación de correo del administrador.** El autoregistro activa la cuenta inmediatamente. Antes de producción debe agregarse confirmación de correo y recuperación segura de contraseña.
5. **Tokens administrativos en `localStorage`.** La CSP reduce riesgo, pero el refresh token debe migrarse a cookie `Secure`, `HttpOnly`, `SameSite`, con revocación en logout y rotación reutilizable segura.
6. **Archivos sensibles.** Vídeos y cédulas aún se guardan en disco local. Deben ir a almacenamiento privado cifrado, con antivirus, URLs firmadas, retención y borrado comprobable.
7. **Cuotas SaaS.** Los límites ya muestran valores consistentes, pero falta impedir realmente la creación al superar usuarios, clientes o préstamos del plan.
8. **Entrega OTP de producción.** Hay configuración local de Resend y reintentos, pero falta verificar dominio/remitente, observabilidad de entrega, cola durable y prueba real extremo a extremo.
9. **Rendimiento inicial.** El bundle principal mide ~1.09 MB minificado (~312 KB gzip). Se recomienda separar por rutas antes del lanzamiento móvil.
10. **Operación de producción.** Falta evidencia de backups/restauración, monitoreo, alertas, trazas, rotación de secretos, WAF/CAPTCHA para formularios públicos y prueba de carga.

## Criterio recomendado de salida

Cambiar a GO únicamente cuando los puntos 1–8 estén cerrados y exista evidencia reproducible de despliegue, migración, rollback, restauración de backup y una transacción QR completa en el entorno HTTPS final. Los puntos 9–10 deben tener al menos umbrales, responsables y fecha comprometida.

## Prueba manual QR sugerida

1. Levantar API/PostgreSQL y Vite.
2. Publicar `http://localhost:5173` mediante ngrok HTTPS o, preferiblemente, el dominio de staging.
3. Abrir `https://<dominio>/portal/pago-qr` en el teléfono; nunca usar `localhost` desde el teléfono.
4. Confirmar que el navegador muestra el permiso de cámara y seleccionar **Permitir mientras se usa el sitio**.
5. Generar un QR nuevo desde el cobrador y escanearlo antes de 5 minutos.
6. Confirmar que la URL resultante conserva el dominio actual y contiene solo `?token=<64 hex>`.
7. Solicitar OTP, verificar recepción, confirmar pago y comprobar cartera, asiento, auditoría e idempotencia.

