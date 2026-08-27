import { useState, useEffect } from 'react';
import { X, CheckCircle, Search } from 'lucide-react';
import { cobradorService } from '../../services/cobradorService';
import { prestamoService } from '../../services/prestamoService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;

export default function AssignLoansModal({ collector, onClose, onAssigned }) {
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        const data = await prestamoService.getAll();
        setLoans(data.filter(l => l.estado !== 'pagado' && l.estado !== 'cancelado'));
      } catch (err) {
        console.error('Error loading loans:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLoans();
  }, []);

  const toggleLoan = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await cobradorService.assignLoans(collector.id, selected);
      onAssigned();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al asignar préstamos');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = loans.filter(l =>
    l.cliente?.toLowerCase().includes(search.toLowerCase()) ||
    l.cedula?.includes(search)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-16 shadow-card-lg max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div>
            <h2 className="text-lg font-bold text-navy-500">Asignar Préstamos</h2>
            <p className="text-sm text-slate-400">A: {collector.nombre} — {collector.zona}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-8 transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-4 border-b border-surface-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Cargando préstamos...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay préstamos disponibles</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((loan) => (
                <label key={loan.id} className={`flex items-center gap-4 p-4 rounded-12 border transition-all cursor-pointer ${selected.includes(loan.id) ? 'border-accent-500 bg-accent-50' : 'border-surface-border hover:bg-surface-hover'}`}>
                  <input type="checkbox" checked={selected.includes(loan.id)} onChange={() => toggleLoan(loan.id)}
                    className="w-4 h-4 text-accent-500 rounded border-surface-border focus:ring-accent-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy-500">{loan.cliente}</p>
                    <p className="text-xs text-slate-400">{loan.cedula} — {loan.frecuencia}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy-500">{fmt(loan.monto)}</p>
                    <p className="text-xs text-slate-400">Saldo: {fmt(loan.saldoPendiente)}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-surface-border flex justify-between items-center">
          <p className="text-sm text-slate-400">{selected.length} préstamo{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-surface-hover rounded-8 transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={selected.length === 0 || submitting}
              className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
              {submitting ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
