import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Percent, Trash2, Edit, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import KPICard from '../../components/KPICard';
import { expenseService } from '../../services/expenseService';
import CreateExpenseModal from '../../components/modals/CreateExpenseModal';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const COLORS = ['#006bff', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'];
const categoryLabels = { salarioCobrador: 'Salario Cobrador', serviciosBasicos: 'Servicios Básicos', oficina: 'Oficina', marketing: 'Marketing', impuestosLegales: 'Impuestos/Legal', transporte: 'Transporte' };

export default function Gastos() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [expensesData, summaryData] = await Promise.all([
        expenseService.getAll(),
        expenseService.getSummary(),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await expenseService.delete(id);
      loadData();
    } catch (err) {
      alert('Error al eliminar gasto');
    }
  };

  const handleEdit = (expense) => setEditingExpense(expense);

  const filtered = expenses.filter(e => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterFrom && new Date(e.date) < new Date(filterFrom)) return false;
    if (filterTo && new Date(e.date) > new Date(filterTo)) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Cargando datos financieros...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Gastos Operacionales</h1>
          <p className="text-slate-400 text-sm">Control de gastos y rentabilidad</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-8 text-sm font-semibold shadow-btn hover:shadow-card-lg transition-all">
          <Plus size={16} /> Nuevo Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard title="Ingresos por Intereses" value={fmt(summary?.totalIngresos)} icon={TrendingUp} color="success" />
        <KPICard title="Total Gastos" value={fmt(summary?.totalGastos)} icon={TrendingDown} color="danger" />
        <KPICard title="Utilidad Neta" value={fmt(summary?.utilidadNeta)} icon={DollarSign} color="accent" />
        <KPICard title="Margen" value={`${summary?.margenPorcentaje || 0}%`} icon={Percent} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-12 p-6 shadow-card border border-surface-border lg:col-span-2">
          <h3 className="text-base font-bold text-navy-500 mb-4">Ingresos vs Gastos (6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.tendenciaMensual || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7edf6" />
              <XAxis dataKey="mes" stroke="#a6bbd1" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a6bbd1" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="ingresos" fill="#059669" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="gastos" fill="#dc2626" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-12 p-6 shadow-card border border-surface-border">
          <h3 className="text-base font-bold text-navy-500 mb-4">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={summary?.gastosPorCategoria || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" nameKey="category">
                {(summary?.gastosPorCategoria || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {(summary?.gastosPorCategoria || []).map((item, index) => (
              <div key={item.category} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-slate-500">{categoryLabels[item.category] || item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-12 shadow-card border border-surface-border">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-base font-bold text-navy-500">Historial de Gastos</h3>
          <div className="flex gap-3">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-surface-fill rounded-8 text-xs border border-surface-border outline-none">
              <option value="">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 bg-surface-fill rounded-8 text-xs border border-surface-border outline-none" />
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 bg-surface-fill rounded-8 text-xs border border-surface-border outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-surface-border">
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Categoría</th>
                <th className="px-6 py-3 font-semibold">Descripción</th>
                <th className="px-6 py-3 font-semibold">Monto</th>
                <th className="px-6 py-3 font-semibold">Registrado por</th>
                <th className="px-6 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay gastos registrados</td></tr>
              ) : filtered.map((expense) => (
                <tr key={expense.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-50 text-navy-600">
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-500">{expense.description}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-danger-500">{fmt(expense.amount)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{expense.recordedByName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(expense)} title="Editar gasto" className="p-1.5 text-slate-400 hover:text-accent-500 hover:bg-accent-50 rounded-6 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} title="Eliminar gasto" className="p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-6 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadData(); }} />}
      {editingExpense && <CreateExpenseModal expense={editingExpense} onClose={() => setEditingExpense(null)} onCreated={() => { setEditingExpense(null); loadData(); }} />}
    </div>
  );
}
