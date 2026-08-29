import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Building2, CreditCard, Gauge, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { clientService } from '../../services/clientService';
import { prestamoService } from '../../services/prestamoService';
import { solicitudService } from '../../services/solicitudService';
import { platformService } from '../../services/platformService';

const money = (value) => `RD$ ${Number(value || 0).toLocaleString('es-DO')}`;

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: null, clients: [], loans: [], requests: [], overview: null, financials: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([platformService.getOverview(), platformService.getFinancials(), dashboardService.getStats(), clientService.getAll(), prestamoService.getAll(), solicitudService.getAll()])
      .then(([overview, financials, stats, clients, loans, requests]) => setData({
        overview: overview.status === 'fulfilled' ? overview.value : null,
        financials: financials.status === 'fulfilled' ? financials.value : null,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        clients: clients.status === 'fulfilled' ? clients.value : [],
        loans: loans.status === 'fulfilled' ? loans.value : [],
        requests: requests.status === 'fulfilled' ? requests.value : [],
      }))
      .finally(() => setLoading(false));
  }, []);

  const stats = data.stats || {};
  const financials = data.financials || {};
  const pending = data.requests.filter((request) => String(request.estado).toLowerCase().includes('pend')).length;
  const activeLoans = data.loans.filter((loan) => String(loan.estado).toLowerCase() === 'activo').length;

  return <div className="min-h-full pb-8">
    <header className="relative mb-8 overflow-hidden rounded-16 bg-navy-900 px-6 py-7 text-white shadow-card-lg sm:px-8 sm:py-9">
      <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-200"><ShieldCheck size={13} /> Control de plataforma</div><h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Centro de mando</h1><p className="mt-2 max-w-xl text-sm leading-6 text-navy-100">Una lectura ejecutiva de la operación financiera y el pulso de tus empresas.</p></div>
        <div className="flex items-center gap-2 rounded-8 border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200"><Activity size={15} /> Sistema operativo</div>
      </div>
    </header>

    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: 'Empresas activas', value: loading ? '…' : data.overview?.empresasActivas ?? '—', icon: Building2, note: `${data.overview?.totalEmpresas ?? 0} registradas`, tone: 'text-accent-600 bg-accent-50' }, { label: 'En período de prueba', value: loading ? '…' : data.overview?.enPrueba ?? '—', icon: Users, note: 'Onboarding comercial', tone: 'text-navy-600 bg-navy-50' }, { label: 'Suscripciones vencidas', value: loading ? '…' : data.overview?.vencidas ?? '—', icon: CreditCard, note: 'Requieren atención', tone: 'text-danger-600 bg-danger-50' }, { label: 'Solicitudes pendientes', value: loading ? '…' : pending, icon: Gauge, note: 'En tenant seleccionado', tone: 'text-warning-600 bg-warning-50' }].map((card) => <div key={card.label} className="rounded-12 border border-surface-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-8 ${card.tone}`}><card.icon size={19} /></div><ArrowUpRight size={16} className="text-slate-300" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p><p className="mt-1 font-display text-3xl font-extrabold text-navy-800">{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.note}</p></div>)}
    </div>

    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-12 border border-surface-border bg-white p-4 shadow-card"><p className="text-xs text-slate-400">Ingreso mensual esperado</p><p className="mt-1 text-xl font-bold text-navy-800">{money(financials.ingresoMensualEsperado)}</p></div><div className="rounded-12 border border-surface-border bg-white p-4 shadow-card"><p className="text-xs text-slate-400">Cortesías activas</p><p className="mt-1 text-xl font-bold text-navy-800">{financials.cortesiasActivas ?? 0}</p></div><div className="rounded-12 border border-surface-border bg-white p-4 shadow-card"><p className="text-xs text-slate-400">Puntualidad de pago</p><p className="mt-1 text-xl font-bold text-success-700">{financials.tasaPagoPuntual ?? 100}%</p></div></div>
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="rounded-16 border border-surface-border bg-white p-6 shadow-card sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Operación</p><h2 className="mt-1 text-lg font-bold text-navy-500">Resumen financiero</h2></div><WalletCards className="text-accent-500" size={21} /></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-12 bg-surface-fill p-4"><p className="text-xs text-slate-400">Capital disponible</p><p className="mt-2 text-xl font-bold text-navy-500">{money(stats.capitalDisponible ?? stats.disponible)}</p></div><div className="rounded-12 bg-success-50 p-4"><p className="text-xs text-success-700">Por cobrar</p><p className="mt-2 text-xl font-bold text-success-700">{money(stats.porCobrar)}</p></div><div className="rounded-12 bg-warning-50 p-4"><p className="text-xs text-warning-700">En cartera</p><p className="mt-2 text-xl font-bold text-warning-700">{stats.enCartera || 0}</p></div></div><div className="mt-6 rounded-12 border border-accent-100 bg-accent-50/40 p-4 text-sm text-slate-600">Los indicadores globales se alimentan de empresas, suscripciones y eventos auditables en tiempo real.</div></section>
      <section className="rounded-16 border border-surface-border bg-navy-800 p-6 text-white shadow-card sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-200">Siguiente acción</p><h2 className="mt-2 text-lg font-bold">Administra la operación</h2><p className="mt-2 text-sm leading-6 text-navy-100">Accede a los módulos operativos mientras habilitamos la gestión global de planes y tenants.</p><div className="mt-6 space-y-2"><button onClick={() => navigate('/admin/clientes')} className="flex w-full items-center justify-between rounded-8 bg-white/10 px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/15">Ver clientes <ArrowUpRight size={16} /></button><button onClick={() => navigate('/admin/solicitudes')} className="flex w-full items-center justify-between rounded-8 bg-white/10 px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/15">Revisar solicitudes <ArrowUpRight size={16} /></button></div></section>
    </div>
  </div>;
}
