import { useState } from 'react';
import { X, Receipt } from 'lucide-react';
import { expenseService } from '../../services/expenseService';

const categories = [
  { value: 'salarioCobrador', label: 'Salario/Comisión Cobrador' },
  { value: 'serviciosBasicos', label: 'Servicios Básicos' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'impuestosLegales', label: 'Impuestos/Legal' },
  { value: 'transporte', label: 'Transporte' },
];

export default function CreateExpenseModal({ onClose, onCreated, expense = null }) {
  const [form, setForm] = useState(() => expense ? {
    category: expense.category || '',
    description: expense.description || '',
    amount: expense.amount ?? '',
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  } : { category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
      };
      if (expense) await expenseService.update(expense.id, payload);
      else await expenseService.create(payload);
      onCreated();
    } catch (err) {
      alert(err.userMessage || err.response?.data?.message || 'Error al crear gasto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-16 shadow-card-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-50 rounded-12 flex items-center justify-center">
              <Receipt className="text-danger-500" size={20} />
            </div>
            <h2 className="text-lg font-bold text-navy-500">{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-8 transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required
              className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none">
              <option value="">Seleccionar categoría</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required
              className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none"
              placeholder="Ej: Pago electricidad mensual" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (RD$)</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-surface-hover rounded-8 transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
              {submitting ? 'Guardando...' : expense ? 'Guardar cambios' : 'Crear Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
