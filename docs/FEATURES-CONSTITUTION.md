# PréstamoPlus — Constitución de Funcionalidades Pendientes

## 1. Tabla de Amortización con Fechas de Pago

### Requisitos
- Cada fila debe incluir la **fecha estimada de pago** según la frecuencia
- Para quincenal: fecha 1 y 15 de cada mes
- Para semanal: cada lunes (o día de inicio)
- Para diaria: cada día
- Para mensual: mismo día del mes
- El backend debe calcular las fechas y enviarlas en el DTO

### DTO Extendido
```json
{
  "numero": 1,
  "fechaPago": "2026-07-01",
  "cuota": 4448.00,
  "capital": 3198.00,
  "interes": 1250.00,
  "saldoInicial": 50000.00,
  "saldoFinal": 46802.00,
  "estado": "pagado" | "pendiente" | "vencido"
}
```

---

## 2. Microservicio de Gestión de Préstamos

### 2.1 Background Service — `LoanManagementService`
Ejecuta tareas automáticas cada X minutos:

| Tarea | Frecuencia | Descripción |
|-------|-----------|-------------|
| Actualizar estados | Cada 5 min | Marcar préstamos vencidos/mora |
| Calcular mora | Diario | Aplicar recargos por atraso |
| Recordatorios WhatsApp | Diario 8am | Enviar recordatorio 3 días antes del vencimiento |
| Recordatorios email | Diario 8am | Enviar email de recordatorio |
| Facturas | Mensual al cierre | Generar y enviar factura PDF |

### 2.2 Cálculo de Mora
- Tasa de mora configurable por tenant: `tasa_mora_diaria = 0.05%` (ej)
- Se aplica sobre el saldo vencido
- Se acumula diariamente hasta que se pague
- Se almacena en tabla `LateFees`

### 2.3 Notificaciones
- **WhatsApp**: Via API de Twilio/WhatsApp Business API
- **Email**: Via SendGrid/MailKit
- **Template**: MessageTemplate entity por tenant

### 2.4 Facturación
- Generar PDF con iTextSharp/PdfSharp
- Datos: cliente, préstamo, cuotas, pagos, mora, total
- Enviar por email y almacenar en BD

---

## 3. Endpoints de Pago

### 3.1 Crear Pago
```
POST /api/payments
{
  "loanId": "guid",
  "monto": 4448.00,
  "metodoPago": "transferencia",
  "referencia": "TRANS-12345"
}
```

### 3.2 Historial de Pagos
```
GET /api/payments/loan/{loanId}
```

### 3.3 Resumen de Pagos
```
GET /api/payments/loan/{loanId}/summary
```
Retorna: total pagado, capital, intereses, mora, próximo pago

### 3.4 Pago de Mora
```
POST /api/payments/mora
{
  "loanId": "guid",
  "monto": 222.40,
  "metodoPago": "efectivo"
}
```

---

## 4. Entidades Nuevas

### LateFee (Mora)
- `Id`, `LoanId`, `Monto`, `DiasAtraso`, `TasaAplicada`, `FechaCalculo`, `Pagado`

### Payment (existente, extender)
- Agregar: `MoraPagada`, `ReferenciaExterna`, `Notas`

### MessageLog
- `Id`, `TenantId`, `Tipo` (whatsapp/email), `Para`, `Mensaje`, `Estado`, `EnviadoEn`

### Invoice
- `Id`, `TenantId`, `LoanId`, `Numero`, `Fecha`, `MontoTotal`, `PdfPath`, `EnviadoEn`

### TenantConfig
- `TasaMoraDiaria`, `DiasGracia`, `TelefonoWhatsApp`, `EmailFrom`

---

## 5. Arquitectura del Microservicio

```
┌─────────────────────────────────────────────┐
│           LoanManagement Worker             │
│  (BackgroundService en .NET 8 Worker)       │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Actualizar│ │ Calcular│ │ Enviar       │  │
│  │ Estados   │ │ Mora    │ │ Notificaciones│ │
│  └─────────┘ └─────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Generar  │ │ WhatsApp│ │ Email        │  │
│  │ Facturas │ │ Service │ │ Service      │  │
│  └─────────┘ └─────────┘ └──────────────┘  │
└─────────────────────────────────────────────┘
         │              │
         ▼              ▼
    ┌─────────┐   ┌──────────┐
    │ SQL DB  │   │ Twilio/  │
    │ SQLite  │   │ SendGrid │
    └─────────┘   └──────────┘
```

---

## 6. Prioridad de Implementación

1. **[P1]** Fechas de pago en tabla de amortización
2. **[P1]** Endpoints de pago (crear, historial, resumen)
3. **[P2]** Background service de actualización de estados
4. **[P2]** Cálculo y acumulación de mora
5. **[P3]** Notificaciones WhatsApp/email (recordatorios)
6. **[P3]** Generación y envío de facturas PDF
7. **[P4]** Dashboard de métricas de cobranza
