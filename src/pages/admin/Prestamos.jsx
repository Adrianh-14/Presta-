import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PrestamoDetailModal from '../../components/modals/PrestamoDetailModal';
import { prestamoService } from '../../services/prestamoService';
import CurrencyFlag from '../../components/CurrencyFlag';
import { getCurrency, formatCurrency } from '../../data/currencies';
import { formatDateOnly } from '../../utils/dateOnly';

const tipoLabels = { personal: 'Personal', garantia: 'Garantía', 0: 'Personal', 1: 'Garantía' };
const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };

const currencyCell = (value, row) => {
  const currency = getCurrency(row?.moneda);
  return <div className="flex items-center gap-2"><CurrencyFlag currency={currency} /><div><p className="font-semibold">{formatCurrency(value, currency.code)}</p><p className="text-[11px] text-gray-400">{currency.name} ({currency.code})</p></div></div>;
};

const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'monto', label: 'Monto', render: currencyCell },
  { key: 'tipo', label: 'Tipo', render: (value) => tipoLabels[value] || String(value || '-') },
  { key: 'frecuenciaPago', label: 'Frecuencia', render: (value) => freqLabels[value] || String(value || '-') },
  { key: 'cuotaMensual', label: 'Cuota', render: currencyCell },
  { key: 'saldoPendiente', label: 'Saldo', render: currencyCell },
  { key: 'fechaVencimiento', label: 'Vencimiento', render: (value) => value ? formatDateOnly(value) : '-' },
  { key: 'estado', label: 'Estado', render: (value) => <StatusBadge status={value} /> },
];

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const estado = filtroEstado === 'todos' ? '' : filtroEstado;
    const tipo = filtroTipo === 'todos' ? '' : filtroTipo;
    prestamoService.getAll(search, estado, tipo)
      .then((data) => { if (active) setPrestamos(data); })
      .catch((err) => console.error('Error loading loans:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, filtroEstado, filtroTipo]);

  const handleCancel = async (id) => {
    try {
      await prestamoService.updateEstado(id, 'Cancelado');
      setPrestamos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: 'cancelado', saldoPendiente: 0 } : p)));
      setSelectedLoan(null);
    } catch (err) {
      console.error('Error cancelling loan:', err);
    }
  };

  const handleMarkLegal = async (id) => {
    try {
      await prestamoService.updateEstado(id, 'Legal');
      setPrestamos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: 'legal' } : p)));
      setSelectedLoan((current) => current?.id === id ? { ...current, estado: 'legal' } : current);
    } catch (err) {
      console.error('Error marking loan as legal:', err);
    }
  };

  const handleRowClick = async (row) => {
    try {
      const full = await prestamoService.getById(row.id);
      setSelectedLoan(full);
    } catch {
      setSelectedLoan(row);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cartera</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Préstamos</h1>
        <p className="mt-1 text-sm text-slate-500">{prestamos.length} préstamos registrados</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-16 border border-surface-border bg-white p-4 shadow-card lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="auth-input w-full pl-10"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-8 border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="vencido">Vencidos</option>
          <option value="mora">En mora</option>
          <option value="pagado">Pagados</option>
          <option value="cancelado">Cancelados</option>
          <option value="legal">En legal</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-8 border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
        >
          <option value="todos">Todos los tipos</option>
          <option value="personal">Personal</option>
          <option value="garantia">Garantía</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Cargando préstamos...</p>
      ) : (
        <DataTable columns={columns} data={prestamos} onRowClick={handleRowClick} />
      )}

      {selectedLoan && (
        <PrestamoDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onCancel={handleCancel}
          onMarkLegal={handleMarkLegal}
        />
      )}
    </div>
  );
}
