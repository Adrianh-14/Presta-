import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ClienteDetailModal from '../../components/modals/ClienteDetailModal';
import { clientService } from '../../services/clientService';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado', render: (value) => <StatusBadge status={value} /> },
  { key: 'fechaRegistro', label: 'Registro', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadClientes();
  }, [search, filtro]);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const estado = filtro === 'todos' ? '' : filtro;
      const data = await clientService.getAll(search, estado);
      setClientes(data);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (row) => {
    setDetailLoading(true);
    try {
      const full = await clientService.getById(row.id);
      setSelectedClient(full);
    } catch {
      setSelectedClient(row);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">{clientes.length} clientes registrados</p>
        </div>
      </div>

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

      {loading ? (
        <p className="text-gray-500 text-center py-8">Cargando clientes...</p>
      ) : (
        <DataTable columns={columns} data={clientes} onRowClick={handleRowClick} />
      )}

      {selectedClient && (
        <ClienteDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </div>
  );
}
