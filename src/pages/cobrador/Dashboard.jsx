import { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';
import KPICard from '../../components/KPICard';
import StatusBadge from '../../components/StatusBadge';
import { collectorPortalService } from '../../services/cobradorService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const freqLabel = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };
const visitLabel = { cobroExitoso: 'Cobro Exitoso', cobroParcial: 'Cobro Parcial', noEncontrado: 'No Encontrado', rechazado: 'Rechazado', clienteAusente: 'Cliente Ausente' };
const visitColor = { cobroExitoso: 'text-success-600 bg-success-50', cobroParcial: 'text-warning-600 bg-warning-50', noEncontrado: 'text-slate-500 bg-slate-100', rechazado: 'text-danger-600 bg-danger-50', clienteAusente: 'text-slate-500 bg-slate-100' };

export default function CollectorDashboard() {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Bienvenido, {dashboard.collectorNombre}</h1>
        <p className="text-slate-400 text-sm">Zona: {dashboard.zona}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard title="Asignados" value={dashboard.totalAsignados} icon={TrendingUp} color="navy" />
        <KPICard title="Cobros Exitosos" value={dashboard.cobrosExitosos} icon={CheckCircle} color="success" />
        <KPICard title="Sin Resultado" value={dashboard.sinResultado} icon={Clock} color="warning" />
        <KPICard title="Monto Cobrado" value={fmt(dashboard.montoCobrado)} icon={DollarSign} color="accent" />
      </div>

      <div className="bg-white rounded-12 shadow-card border border-surface-border">
        <div className="p-6 border-b border-surface-border">
          <h2 className="text-lg font-bold text-navy-500">Mis Asignaciones</h2>
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
              {dashboard.asignaciones.map((a) => (
                <tr key={a.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
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
    </div>
  );
}
