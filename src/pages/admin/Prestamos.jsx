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
