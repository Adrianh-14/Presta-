// src/data/mockData.js
export const clientes = [
  { id: 1, nombre: 'Juan Pérez', cedula: '001-1234567-8', email: 'juan@email.com', telefono: '809-555-0101', estado: 'activo', fechaRegistro: '2026-01-15' },
  { id: 2, nombre: 'María García', cedula: '001-2345678-9', email: 'maria@email.com', telefono: '809-555-0102', estado: 'activo', fechaRegistro: '2026-02-20' },
  { id: 3, nombre: 'Carlos López', cedula: '001-3456789-0', email: 'carlos@email.com', telefono: '809-555-0103', estado: 'activo', fechaRegistro: '2026-03-10' },
  { id: 4, nombre: 'Ana Martínez', cedula: '001-4567890-1', email: 'ana@email.com', telefono: '809-555-0104', estado: 'inactivo', fechaRegistro: '2026-04-05' },
  { id: 5, nombre: 'Pedro Rodríguez', cedula: '001-5678901-2', email: 'pedro@email.com', telefono: '809-555-0105', estado: 'activo', fechaRegistro: '2026-05-12' },
];

export const prestamos = [
  { id: 1, clienteId: 1, cliente: 'Juan Pérez', monto: 50000, tasa: 12, plazo: 12, cuotaMensual: 4448, estado: 'activo', fechaInicio: '2026-01-20', fechaVencimiento: '2027-01-20', tipo: 'personal', saldoPendiente: 42000 },
  { id: 2, clienteId: 2, cliente: 'María García', monto: 150000, tasa: 10, plazo: 24, cuotaMensual: 6932, estado: 'activo', fechaInicio: '2026-02-25', fechaVencimiento: '2028-02-25', tipo: 'garantia', saldoPendiente: 135000 },
  { id: 3, clienteId: 3, cliente: 'Carlos López', monto: 25000, tasa: 15, plazo: 6, cuotaMensual: 4515, estado: 'vencido', fechaInicio: '2026-03-15', fechaVencimiento: '2026-06-15', tipo: 'personal', saldoPendiente: 18500 },
  { id: 4, clienteId: 4, cliente: 'Ana Martínez', monto: 75000, tasa: 11, plazo: 18, cuotaMensual: 4623, estado: 'activo', fechaInicio: '2026-04-10', fechaVencimiento: '2027-10-10', tipo: 'garantia', saldoPendiente: 65000 },
  { id: 5, clienteId: 5, cliente: 'Pedro Rodríguez', monto: 30000, tasa: 14, plazo: 8, cuotaMensual: 4234, estado: 'mora', fechaInicio: '2026-05-15', fechaVencimiento: '2027-01-15', tipo: 'personal', saldoPendiente: 26000 },
  { id: 6, clienteId: 1, cliente: 'Juan Pérez', monto: 40000, tasa: 13, plazo: 10, cuotaMensual: 4562, estado: 'pagado', fechaInicio: '2025-06-01', fechaVencimiento: '2026-04-01', tipo: 'personal', saldoPendiente: 0 },
];

export const solicitudes = [
  { id: 1, cliente: 'Roberto Sánchez', email: 'roberto@email.com', telefono: '809-555-0201', monto: 60000, plazo: 12, tipo: 'personal', estado: 'pendiente', fechaSolicitud: '2026-06-18', ingresoMensual: 15000, empresa: 'TechCorp' },
  { id: 2, cliente: 'Laura Díaz', email: 'laura@email.com', telefono: '809-555-0202', monto: 120000, plazo: 24, tipo: 'garantia', estado: 'pendiente', fechaSolicitud: '2026-06-17', ingresoMensual: 25000, empresa: 'FinanceHub' },
  { id: 3, cliente: 'Miguel Torres', email: 'miguel@email.com', telefono: '809-555-0203', monto: 45000, plazo: 8, tipo: 'personal', estado: 'aprobada', fechaSolicitud: '2026-06-15', ingresoMensual: 12000, empresa: 'DataSoft' },
  { id: 4, cliente: 'Sofía Ramírez', email: 'sofia@email.com', telefono: '809-555-0204', monto: 200000, plazo: 36, tipo: 'garantia', estado: 'rechazada', fechaSolicitud: '2026-06-14', ingresoMensual: 30000, empresa: 'InversionesCR' },
];

export const kpis = {
  totalPrestado: 320000,
  disponible: 680000,
  enCartera: 5,
  porCobrar: 286500,
};

export const graficoPrestamosPorMes = [
  { mes: 'Ene', cantidad: 3 },
  { mes: 'Feb', cantidad: 5 },
  { mes: 'Mar', cantidad: 4 },
  { mes: 'Abr', cantidad: 6 },
  { mes: 'May', cantidad: 8 },
  { mes: 'Jun', cantidad: 7 },
];

export const graficoPorTipo = [
  { nombre: 'Personal', valor: 105000 },
  { nombre: 'Garantía', valor: 215000 },
];

export const graficoPorEstado = [
  { nombre: 'Al día', valor: 3 },
  { nombre: 'Vencido', valor: 1 },
  { nombre: 'Mora', valor: 1 },
];
