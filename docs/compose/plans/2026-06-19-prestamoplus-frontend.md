# PréstamoPlus Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a modern React frontend for a loan management system with admin dashboard and client portal.

**Architecture:** React 18 + Vite with React Router for two separate flows (admin/client), Tailwind CSS for styling, Recharts for charts, React Hook Form for forms. Mock data only (no backend).

**Tech Stack:** React 18, Vite, React Router v6, Tailwind CSS, Recharts, Lucide React, React Hook Form

---

## File Structure

```
/src
  /pages/admin
    Dashboard.jsx        → Main dashboard with KPIs and charts
    Clientes.jsx         → Client list and management
    Prestamos.jsx        → Loan portfolio table
    Solicitudes.jsx      → Pending applications
    Layout.jsx           → Admin layout with sidebar
  /pages/client
    Solicitud.jsx        → Client application form
  /components
    Sidebar.jsx          → Admin sidebar navigation
    KPICard.jsx          → Reusable KPI card
    DataTable.jsx        → Reusable table component
    StatusBadge.jsx      → Status indicator badges
    ChartCard.jsx        → Chart wrapper component
  /data
    mockData.js          → All mock data
  App.jsx                → Router setup
  main.jsx               → Entry point
  index.css              → Tailwind imports
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd "C:\Users\adria\PréstamoPlus"
npm create vite@latest . -- --template react
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom recharts lucide-react react-hook-form
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Configure CSS**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

- [ ] **Step 5: Create basic App with router**

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Prestamos from './pages/admin/Prestamos';
import Solicitudes from './pages/admin/Solicitudes';
import Solicitud from './pages/client/Solicitud';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="solicitudes" element={<Solicitudes />} />
        </Route>
        <Route path="/solicitud" element={<Solicitud />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

- [ ] **Step 6: Verify setup works**

```bash
npm run dev
```
Expected: Dev server starts on http://localhost:5173

---

## Task 2: Mock Data

**Files:**
- Create: `src/data/mockData.js`

- [ ] **Step 1: Create mock data file**

```javascript
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
```

- [ ] **Step 2: Verify data imports correctly**

```bash
npm run dev
```
Expected: No errors in console

---

## Task 3: Layout Components

**Files:**
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/KPICard.jsx`
- Create: `src/components/StatusBadge.jsx`
- Create: `src/components/DataTable.jsx`
- Create: `src/pages/admin/Layout.jsx`

- [ ] **Step 1: Create Sidebar component**

```jsx
// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, LogOut } from 'lucide-react';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/clientes', icon: Users, label: 'Clientes' },
  { path: '/admin/prestamos', icon: CreditCard, label: 'Préstamos' },
  { path: '/admin/solicitudes', icon: FileText, label: 'Solicitudes' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">PréstamoPlus</h1>
        <p className="text-sm text-gray-500">Panel de Administración</p>
      </div>
      <nav className="p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg w-full">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create KPICard component**

```jsx
// src/components/KPICard.jsx
export default function KPICard({ title, value, icon: Icon, color = 'primary', change, changeType }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create StatusBadge component**

```jsx
// src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const styles = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    vencido: 'bg-red-100 text-red-700',
    mora: 'bg-orange-100 text-orange-700',
    pagado: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

- [ ] **Step 4: Create DataTable component**

```jsx
// src/components/DataTable.jsx
export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Admin Layout**

```jsx
// src/pages/admin/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Task 4: Dashboard Page

**Files:**
- Create: `src/pages/admin/Dashboard.jsx`

- [ ] **Step 1: Create Dashboard with KPIs and Charts**

```jsx
// src/pages/admin/Dashboard.jsx
import { DollarSign, Wallet, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import { kpis, graficoPrestamosPorMes, graficoPorTipo, graficoPorEstado, prestamos } from '../../data/mockData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const prestamosProximosVencer = prestamos.filter(p => {
    if (p.estado !== 'activo') return false;
    const vencimiento = new Date(p.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes <= 30 && diasRestantes > 0;
  });

  const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido' || p.estado === 'mora');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general del sistema de préstamos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Prestado"
          value={`$${kpis.totalPrestado.toLocaleString()}`}
          icon={DollarSign}
          color="primary"
          change="12% vs mes anterior"
          changeType="positive"
        />
        <KPICard
          title="Disponible"
          value={`$${kpis.disponible.toLocaleString()}`}
          icon={Wallet}
          color="success"
        />
        <KPICard
          title="En Cartera"
          value={kpis.enCartera}
          icon={Users}
          color="warning"
        />
        <KPICard
          title="Por Cobrar"
          value={`$${kpis.porCobrar.toLocaleString()}`}
          icon={TrendingUp}
          color="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Préstamos por mes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Préstamos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graficoPrestamosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por tipo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={graficoPorTipo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="valor"
              >
                {graficoPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {graficoPorTipo.map((item, index) => (
              <div key={item.nombre} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-gray-600">{item.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos a vencer */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos a Vencer</h3>
          {prestamosProximosVencer.length === 0 ? (
            <p className="text-gray-500">No hay préstamos próximos a vencer</p>
          ) : (
            <div className="space-y-3">
              {prestamosProximosVencer.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.cliente}</p>
                    <p className="text-sm text-gray-500">Vence: {p.fechaVencimiento}</p>
                  </div>
                  <span className="font-semibold text-yellow-700">${p.saldoPendiente.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vencidos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vencidos y Mora</h3>
          {prestamosVencidos.length === 0 ? (
            <p className="text-gray-500">No hay préstamos vencidos</p>
          ) : (
            <div className="space-y-3">
              {prestamosVencidos.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.cliente}</p>
                    <p className="text-sm text-gray-500">{p.estado === 'mora' ? 'En mora' : 'Vencido'}</p>
                  </div>
                  <span className="font-semibold text-red-700">${p.saldoPendiente.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Task 5: Clientes Page

**Files:**
- Create: `src/pages/admin/Clientes.jsx`

- [ ] **Step 1: Create Clientes page with search and table**

```jsx
// src/pages/admin/Clientes.jsx
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { clientes } from '../../data/mockData';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado', render: (value) => <StatusBadge status={value} /> },
  { key: 'fechaRegistro', label: 'Registro' },
];

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const clientesFiltrados = clientes.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
                       c.email.toLowerCase().includes(search.toLowerCase()) ||
                       c.cedula.includes(search);
    const matchFiltro = filtro === 'todos' || c.estado === filtro;
    return matchSearch && matchFiltro;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">{clientes.length} clientes registrados</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <DataTable columns={columns} data={clientesFiltrados} />
    </div>
  );
}
```

---

## Task 6: Préstamos Page

**Files:**
- Create: `src/pages/admin/Prestamos.jsx`

- [ ] **Step 1: Create Prestamos page with filters**

```jsx
// src/pages/admin/Prestamos.jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { prestamos } from '../../data/mockData';

const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'monto', label: 'Monto', render: (value) => `$${value.toLocaleString()}` },
  { key: 'tipo', label: 'Tipo', render: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
  { key: 'cuotaMensual', label: 'Cuota', render: (value) => `$${value.toLocaleString()}` },
  { key: 'saldoPendiente', label: 'Saldo', render: (value) => `$${value.toLocaleString()}` },
  { key: 'fechaVencimiento', label: 'Vencimiento' },
  { key: 'estado', label: 'Estado', render: (value) => <StatusBadge status={value} /> },
];

export default function Prestamos() {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const prestamosFiltrados = prestamos.filter((p) => {
    const matchSearch = p.cliente.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cartera de Préstamos</h1>
        <p className="text-gray-500">{prestamos.length} préstamos registrados</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="vencido">Vencidos</option>
          <option value="mora">En mora</option>
          <option value="pagado">Pagados</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todos">Todos los tipos</option>
          <option value="personal">Personal</option>
          <option value="garantia">Garantía</option>
        </select>
      </div>

      <DataTable columns={columns} data={prestamosFiltrados} />
    </div>
  );
}
```

---

## Task 7: Solicitudes Page

**Files:**
- Create: `src/pages/admin/Solicitudes.jsx`

- [ ] **Step 1: Create Solicitudes page with approval actions**

```jsx
// src/pages/admin/Solicitudes.jsx
import { useState } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { solicitudes } from '../../data/mockData';

export default function Solicitudes() {
  const [filtro, setFiltro] = useState('todos');
  const [solicitudesData, setSolicitudesData] = useState(solicitudes);

  const solicitudesFiltradas = solicitudesData.filter((s) => {
    return filtro === 'todos' || s.estado === filtro;
  });

  const handleAprobar = (id) => {
    setSolicitudesData(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'aprobada' } : s
    ));
  };

  const handleRechazar = (id) => {
    setSolicitudesData(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'rechazada' } : s
    ));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <p className="text-gray-500">{solicitudesData.filter(s => s.estado === 'pendiente').length} pendientes de revisión</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {solicitudesFiltradas.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{s.cliente}</h3>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
              <StatusBadge status={s.estado} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Monto solicitado</p>
                <p className="font-semibold text-gray-900">${s.monto.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plazo</p>
                <p className="font-semibold text-gray-900">{s.plazo} meses</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-semibold text-gray-900">{s.tipo === 'personal' ? 'Personal' : 'Garantía'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingreso mensual</p>
                <p className="font-semibold text-gray-900">${s.ingresoMensual.toLocaleString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <p>Empresa: {s.empresa}</p>
              <p>Fecha: {s.fechaSolicitud}</p>
            </div>

            {s.estado === 'pendiente' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleAprobar(s.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                  Aprobar
                </button>
                <button
                  onClick={() => handleRechazar(s.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                  Rechazar
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye size={16} />
                  Ver detalles
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 8: Client Portal (Solicitud Form)

**Files:**
- Create: `src/pages/client/Solicitud.jsx`

- [ ] **Step 1: Create multi-step form for client application**

```jsx
// src/pages/client/Solicitud.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, User, Briefcase, MapPin, Users } from 'lucide-react';

const steps = [
  { id: 1, title: 'Datos Personales', icon: User },
  { id: 2, title: 'Información Laboral', icon: Briefcase },
  { id: 3, title: 'Ubicación', icon: MapPin },
  { id: 4, title: 'Referencias', icon: Users },
];

export default function Solicitud() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const onSubmit = (data) => {
    console.log('Solicitud enviada:', data);
    setSubmitted(true);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-500 mb-6">
            Tu solicitud ha sido recibida exitosamente. Nos pondremos en contacto contigo por correo electrónico en un plazo de 24-48 horas.
          </p>
          <p className="text-sm text-gray-400">
            Referencia: #SP-{Date.now().toString().slice(-6)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary-600">PréstamoPlus</h1>
          <p className="text-sm text-gray-500">Solicitud de Préstamo</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className="hidden md:block font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Step 1: Datos Personales */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Datos Personales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                  <input
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Juan Pérez"
                  />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RNC *</label>
                  <input
                    {...register('cedula', { required: 'La cédula es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="001-1234567-8"
                  />
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input
                    {...register('telefono', { required: 'El teléfono es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="809-555-0101"
                  />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de nacimiento *</label>
                  <input
                    {...register('fechaNacimiento', { required: 'La fecha es requerida' })}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.fechaNacimiento && <p className="text-red-500 text-sm mt-1">{errors.fechaNacimiento.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado civil *</label>
                  <select
                    {...register('estadoCivil', { required: 'El estado civil es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                  </select>
                  {errors.estadoCivil && <p className="text-red-500 text-sm mt-1">{errors.estadoCivil.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Información Laboral */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Laboral</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa *</label>
                  <input
                    {...register('empresa', { required: 'La empresa es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre de la empresa"
                  />
                  {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                  <input
                    {...register('cargo', { required: 'El cargo es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Tu cargo actual"
                  />
                  {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salario mensual *</label>
                  <input
                    {...register('salario', { required: 'El salario es requerido' })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="15000"
                  />
                  {errors.salario && <p className="text-red-500 text-sm mt-1">{errors.salario.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad (años) *</label>
                  <input
                    {...register('antiguedad', { required: 'La antigüedad es requerida' })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="3"
                  />
                  {errors.antiguedad && <p className="text-red-500 text-sm mt-1">{errors.antiguedad.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de la empresa</label>
                  <input
                    {...register('direccionEmpresa')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de la empresa</label>
                  <input
                    {...register('telefonoEmpresa')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="809-555-0202"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de empleo *</label>
                  <select
                    {...register('tipoEmpleo', { required: 'El tipo de empleo es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="formal">Formal (con contrato)</option>
                    <option value="informal">Informal</option>
                    <option value="independiente">Independiente</option>
                    <option value="jubilado">Jubilado</option>
                  </select>
                  {errors.tipoEmpleo && <p className="text-red-500 text-sm mt-1">{errors.tipoEmpleo.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Ubicación */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubicación</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección completa *</label>
                  <input
                    {...register('direccion', { required: 'La dirección es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Calle, número, urbanización"
                  />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                  <input
                    {...register('ciudad', { required: 'La ciudad es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Santo Domingo"
                  />
                  {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                  <select
                    {...register('provincia', { required: 'La provincia es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="DN">Distrito Nacional</option>
                    <option value="SD">Santo Domingo</option>
                    <option value="SC">Santiago</option>
                    <option value="PR">Puerto Plata</option>
                    <option value="LA">La Altagracia</option>
                  </select>
                  {errors.provincia && <p className="text-red-500 text-sm mt-1">{errors.provincia.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <input
                    {...register('sector')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Zona colonial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input
                    {...register('codigoPostal')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="10101"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Referencias */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Referencias Personales</h2>
              <p className="text-gray-500 mb-6">Proporciona al menos dos referencias que puedan confirmar tu identidad.</p>
              
              {/* Referencia 1 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 1</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input
                      {...register('ref1Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nombre de la referencia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select
                      {...register('ref1Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      {...register('ref1Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="809-555-0301"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      {...register('ref1Email')}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="referencia@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Referencia 2 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 2</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input
                      {...register('ref2Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nombre de la referencia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select
                      {...register('ref2Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      {...register('ref2Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="809-555-0302"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      {...register('ref2Email')}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="referencia@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Detalles del Préstamo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto solicitado *</label>
                    <input
                      {...register('montoSolicitado', { required: 'El monto es requerido' })}
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plazo (meses) *</label>
                    <input
                      {...register('plazoMeses', { required: 'El plazo es requerido' })}
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de préstamo *</label>
                    <select
                      {...register('tipoPrestamo', { required: 'El tipo es requerido' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="personal">Personal</option>
                      <option value="garantia">Con garantía</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Propósito del préstamo *</label>
                    <input
                      {...register('proposito', { required: 'El propósito es requerido' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ej: Educación, negocio, emergencia"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={20} />
                Enviar Solicitud
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Final Verification

- [ ] **Step 1: Run dev server and verify all pages work**

```bash
npm run dev
```

Check:
- http://localhost:5173/admin → Dashboard loads with KPIs and charts
- http://localhost:5173/admin/clientes → Client list with search
- http://localhost:5173/admin/prestamos → Loan portfolio with filters
- http://localhost:5173/admin/solicitudes → Applications with approve/reject
- http://localhost:5173/solicitud → Client form with 4 steps

- [ ] **Step 2: Verify responsive design**

Check mobile view works correctly on all pages.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete PréstamoPlus loan management frontend"
```
