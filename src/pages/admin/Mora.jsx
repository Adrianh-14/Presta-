import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Scale, Users, Wallet, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { moraService } from '../../services/moraService';
import { formatCurrency, getCurrency } from '../../data/currencies';
import CurrencyFlag from '../../components/CurrencyFlag';
import StatusBadge from '../../components/StatusBadge';

const normalize = (value) => String(value || '').toLowerCase();

export default function Mora() {
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moraService.getOverview().then(setOverview).catch((error) => console.error('Error loading mora overview:', error)).finally(() => setLoading(false));
  }, []);

  const loans = useMemo(() => (overview?.prestamos || []).filter((loan) => {
    const matchesSearch = !search || `${loan.cliente} ${loan.cedula || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || (filter === 'legal' ? normalize(loan.estado) === 'legal' : normalize(loan.estado) === 'mora');
    return matchesSearch && matchesFilter;
  }), [overview, search, filter]);

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Cargando historial de mora...</div>;

  return <div>
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-danger-600">Riesgo y recuperación</p><h1 className="mt-1 font-display text-3xl font-extrabold text-navy-800">Mora y cobranza</h1><p className="text-sm text-slate-500">Clientes en mora, reincidencia por cuota y casos enviados a legal.</p></div>
      <span className="rounded-full border border-warning-200 bg-warning-50 px-3 py-1.5 text-xs font-semibold text-warning-700">Datos de cartera real</span>
    </div>

    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Clientes en mora" value={overview?.totalClientesEnMora || 0} />
      <Metric icon={AlertTriangle} label="Préstamos en mora" value={overview?.totalPrestamosEnMora || 0} />
      <Metric icon={Wallet} label="Mora pendiente" value={formatCurrency(overview?.totalMoraPendiente || 0, 'DOP')} />
      <Metric icon={Scale} label="Casos en legal" value={overview?.totalCasosLegales || 0} />
    </div>

    <section className="mb-8 rounded-12 border border-surface-border bg-white p-6 shadow-card">
      <div className="mb-4"><h2 className="text-lg font-bold text-navy-500">En qué cuota ocurre la mora</h2><p className="text-sm text-slate-400">Permite identificar la primera cuota problemática y la reincidencia.</p></div>
      <div className="h-72">{overview?.porCuota?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={overview.porCuota}><CartesianGrid strokeDasharray="3 3" stroke="#e7edf6" /><XAxis dataKey="cuota" tickFormatter={(value) => `#${value}`} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(value) => `Cuota #${value}`} formatter={(value, name) => [value, name === 'eventos' ? 'Eventos' : 'Monto']} /><Bar dataKey="eventos" fill="#ef4444" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Aún no hay eventos de mora registrados.</div>}</div>
    </section>

    <section className="rounded-12 border border-surface-border bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-surface-border p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente o cédula..." className="w-full rounded-8 border border-surface-border bg-surface-fill py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent-500" /></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-8 border border-surface-border bg-white px-3 py-2 text-sm"><option value="todos">Mora y legal</option><option value="mora">Solo mora</option><option value="legal">Solo legal</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-canvas text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Préstamo</th><th className="px-5 py-3">Mora pendiente</th><th className="px-5 py-3">Cuotas atrasadas</th><th className="px-5 py-3">Veces en mora</th><th className="px-5 py-3">Estado</th></tr></thead><tbody className="divide-y divide-surface-border">{loans.map((loan) => { const currency = getCurrency(loan.moneda); return <tr key={loan.loanId} className="hover:bg-surface-canvas"><td className="px-5 py-4"><p className="font-semibold text-navy-500">{loan.cliente}</p><p className="text-xs text-slate-400">{loan.cedula || loan.telefono || 'Sin contacto'}</p></td><td className="px-5 py-4"><div className="flex items-center gap-2"><CurrencyFlag currency={currency} /><span>{formatCurrency(loan.saldo, currency.code)}</span></div></td><td className="px-5 py-4 font-semibold text-danger-600">{formatCurrency(loan.moraPendiente, currency.code)}</td><td className="px-5 py-4">{loan.cuotasAtrasadas}</td><td className="px-5 py-4">{loan.vecesEnMora}</td><td className="px-5 py-4"><StatusBadge status={normalize(loan.estado)} /></td></tr>; })}</tbody></table>{!loans.length && <p className="p-8 text-center text-sm text-slate-400">No hay registros para este filtro.</p>}</div>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value }) { return <div className="rounded-12 border border-surface-border bg-white p-5 shadow-card"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><Icon size={18} className="text-danger-500" /></div><p className="mt-3 text-2xl font-extrabold text-navy-500">{value}</p></div>; }
