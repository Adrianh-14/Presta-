import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CheckCircle, Clock, DollarSign, MapPin } from 'lucide-react';
import KPICard from '../../components/KPICard';
import StatusBadge from '../../components/StatusBadge';
import { collectorPortalService } from '../../services/cobradorService';

const fmt = (n) => `RD$${(n || 0).toLocaleString('es-DO')}`;
const freqLabel = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };
const visitLabel = { cobroExitoso: 'Cobro Exitoso', cobroParcial: 'Cobro Parcial', noEncontrado: 'No Encontrado', rechazado: 'Rechazado', clienteAusente: 'Cliente Ausente' };
const visitColor = { cobroExitoso: 'text-success-600 bg-success-50', cobroParcial: 'text-warning-600 bg-warning-50', noEncontrado: 'text-slate-500 bg-slate-100', rechazado: 'text-danger-600 bg-danger-50', clienteAusente: 'text-slate-500 bg-slate-100' };

export default function CollectorDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await collectorPortalService.getDashboard();
        setDashboard(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Cargando...</p></div>;
  if (!dashboard) return <p className="text-slate-400">Error al cargar datos</p>;

  const assignments = dashboard.asignaciones || [];
  const nextVisits = assignments.slice(0, 3);
  const amountDue = assignments.reduce((total, item) => total + Number(item.cuotaMensual || 0), 0);
  const progress = dashboard.totalAsignados ? Math.min(100, Math.round((Number(dashboard.cobrosExitosos || 0) / Number(dashboard.totalAsignados)) * 100)) : 0;

  return (
    <div>
      <section className="flex min-h-[calc(100vh-6rem)] flex-col gap-4 px-5 pb-4 pt-7 md:hidden">
        <header>
          <p className="text-sm text-navy-900/65">Ruta de hoy</p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight text-navy-900">{dashboard.collectorNombre || 'Cobrador'}</h1>
        </header>

        <section className="rounded-16 bg-navy-900 p-5 text-surface-canvas shadow-card-lg">
          <p className="text-sm text-surface-canvas/75">Por cobrar hoy</p>
          <p className="mt-0.5 font-display text-[40px] font-extrabold leading-tight">{fmt(amountDue)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-700"><div className="h-full rounded-full bg-warning-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs text-surface-canvas/75">{dashboard.cobrosExitosos || 0} de {dashboard.totalAsignados || 0} visitas hechas</p>
        </section>

        <h2 className="mt-1 text-[17px] font-bold text-navy-900">Siguientes visitas</h2>
        <div className="flex flex-col gap-2.5">
          {nextVisits.map((item, index) => {
            const overdue = String(item.ultimoResultado || '').toLowerCase().includes('rechaz') || String(item.ultimoResultado || '').toLowerCase().includes('mora');
            return <article key={item.id || index} className="flex items-center justify-between gap-2.5 rounded-12 bg-white p-3.5 shadow-card">
              <div className="min-w-0">
                <p className="truncate font-bold text-navy-900">{item.clienteNombre || item.cliente || 'Cliente'}</p>
                <p className={`text-[13px] font-bold ${overdue ? 'text-warning-700' : 'text-success-700'}`}>{overdue ? 'Vencida · revisar' : 'Al día'}</p>
                <p className="text-[13px] text-navy-900/60">{fmt(item.cuotaMensual)} · {item.zona || item.sector || 'Tu zona'}</p>
              </div>
              <button type="button" onClick={() => navigate(`/cobrador/cobros/${item.id}`)} className="shrink-0 rounded-8 bg-warning-500 px-4 py-3 text-sm font-bold text-navy-900 transition hover:bg-warning-400">Cobrar</button>
            </article>;
          })}
          {!nextVisits.length && <p className="rounded-12 bg-white p-5 text-center text-sm text-slate-500 shadow-card">No tienes visitas asignadas.</p>}
        </div>
      </section>

      <section className="hidden md:block">
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Ruta de hoy</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Hola, {dashboard.collectorNombre}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} className="text-accent-600" /> {dashboard.zona || 'Tu zona asignada'}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KPICard title="Asignados" value={dashboard.totalAsignados} icon={TrendingUp} color="navy" />
        <KPICard title="Cobros Exitosos" value={dashboard.cobrosExitosos} icon={CheckCircle} color="success" />
        <KPICard title="Sin Resultado" value={dashboard.sinResultado} icon={Clock} color="warning" />
        <KPICard title="Monto Cobrado" value={fmt(dashboard.montoCobrado)} icon={DollarSign} color="accent" />
      </div>

      <div className="rounded-16 border border-surface-border bg-white shadow-card">
        <div className="border-b border-surface-border p-5 sm:p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">Visitas</p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-navy-800">Mis asignaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-surface-border">
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Préstamo</th>
                <th className="px-6 py-3 font-semibold">Cuota</th>
                <th className="px-6 py-3 font-semibold">Saldo</th>
                <th className="px-6 py-3 font-semibold">Frecuencia</th>
                <th className="px-6 py-3 font-semibold">Último Resultado</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-surface-border transition-colors hover:bg-surface-hover">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-navy-500">{a.clienteNombre}</p>
                    <p className="text-xs text-slate-400">{a.clienteCedula}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-500">{fmt(a.montoOriginal)}</td>
                  <td className="px-6 py-4 text-sm text-navy-500">{fmt(a.cuotaMensual)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-accent-500">{fmt(a.saldoPendiente)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{freqLabel[a.frecuencia] || a.frecuencia}</td>
                  <td className="px-6 py-4">
                    {a.ultimoResultado ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${visitColor[a.ultimoResultado] || 'bg-slate-100 text-slate-500'}`}>
                        {visitLabel[a.ultimoResultado] || a.ultimoResultado}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </section>
    </div>
  );
}
