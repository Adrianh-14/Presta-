# PréstamoPlus — Constitución SaaS

## Visión
PréstamoPlus es una plataforma SaaS de gestión de préstamos financieros que permite
a múltiples instituciones (bancos, cooperativas, financieras) operar de forma aislada
sobre una misma infraestructura compartida.

---

## 1. Multi-Tenancy

### Estrategia: Shared Database + TenantId Column
Cada registro del sistema pertenece a un Tenant (institución financiera).
El tenant se hereda del JWT del usuario autenticado.

### Entidad Tenant
- `Id` (Guid)
- `Nombre` — Nombre de la institución
- `Slug` — Identificador único (URL-friendly)
- `RNC` — Registro Nacional de Contribuyentes
- `Email`, `Telefono`
- `LogoUrl`
- `IsActive`
- `CreatedAt`, `UpdatedAt`

### Aislamiento
- TODAS las entidades de negocio llevan `TenantId` (Guid)
- El middleware `TenantMiddleware` extrae el tenant del JWT y lo inyecta en el `HttpContext`
- Los Repositories filtran automáticamente por `TenantId`
- Las migraciones crean índices compuestos `(TenantId, ...)`

### Entidades con TenantId
- Client
- LoanApplication
- Loan
- Payment
- User (pertenecen a un tenant)

---

## 2. Suscripciones y Planes

### Planes
| Plan | Precio/mes | Clientes | Préstamos | Usuarios | Features |
|------|-----------|----------|-----------|----------|----------|
| Basic | $49 | 100 | 50 | 3 | Dashboard, Solicitudes |
| Pro | $149 | 500 | 250 | 10 | + Reportes, API |
| Enterprise | $499 | ∞ | ∞ | ∞ | + White-label, Soporte |

### Entidad Subscription
- `Id`, `TenantId`
- `PlanId` (Basic/Pro/Enterprise)
- `Status` (Active/Trialing/PastDue/Cancelled)
- `CurrentPeriodStart`, `CurrentPeriodEnd`
- `StripeCustomerId`, `StripeSubscriptionId`
- `TrialEndsAt` (nullable)

---

## 3. Feature Flags

Cada plan define qué features están habilitadas:
- `canViewDashboard` — Ver dashboard con KPIs
- `canManageClients` — CRUD de clientes
- `canManageLoans` — CRUD de préstamos
- `canApproveSolicitudes` — Aprobar/rechazar solicitudes
- `canViewReports` — Reportes avanzados
- `canAccessApi` — Acceso a API externa
- `canWhiteLabel` — Personalización de marca

### Límites por Plan
- `maxClients` — Número máximo de clientes
- `maxLoans` — Número máximo de préstamos activos
- `maxUsers` — Número máximo de usuarios

---

## 4. User Onboarding

### Flujo
1. Registro → Se crea Tenant + User Admin
2. Completar perfil del Tenant (nombre, RNC, logo)
3. Invitar miembros del equipo
4. Configurar datos bancarios del tenant
5. Primer préstamo de prueba

### Tracking
- `OnboardingStep` enum: ProfileComplete, TeamInvited, FirstLoan
- `Tenant.OnboardingCompletedAt` (nullable)

---

## 5. Seguridad Multi-Tenant

- JWT contiene: `sub` (userId), `email`, `role`, `tenantId`
- Middleware valida que el usuario pertenece al tenant
- Queries siempre filtran por `TenantId`
- Un usuario NO puede acceder a datos de otro tenant
- Roles por tenant: Admin, Manager, Operator, Viewer

---

## 6. API Design

### Endpoints por Tenant
```
GET    /api/tenants/{slug}          — Info del tenant (público)
POST   /api/tenants                 — Crear tenant (registro)
GET    /api/tenants/current         — Tenant del usuario actual
PUT    /api/tenants/current         — Actualizar tenant
GET    /api/tenants/current/subscription — Ver suscripción
POST   /api/tenants/current/subscription/upgrade — Upgrade de plan
```

### Endpoints de Features
```
GET    /api/features                — Features habilitadas del tenant actual
GET    /api/features/{key}          — Verificar si una feature está habilitada
```
