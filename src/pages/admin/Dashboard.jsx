import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Users, TrendingUp, TrendingDown, CalendarClock, X, ArrowRight, Phone, Mail, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import StatusBadge from '../../components/StatusBadge';
import { dashboardService } from '../../services/dashboardService';
import { prestamoService } from '../../services/prestamoService';
import { expenseService } from '../../services/expenseService';
import { getCurrency } from '../../data/currencies';
import CurrencyFlag from '../../components/CurrencyFlag';
import { formatDateOnly } from '../../utils/dateOnly';

const COLORS = ['#071B2E', '#FFB547', '#9AA9B8', '#D9F5E6'];

const freqLabel = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };
const currencyMeta = { DOP: { flag: '🇩🇴', label: 'Pesos dominicanos' }, USD: { flag: '🇺🇸', label: 'Dólares estadounidenses' }, EUR: { flag: '🇪🇺', label: 'Euros' } };
const formatMoney = (value, currency = 'DOP') => new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(Number(value || 0));

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loansByMonth, setLoansByMonth] = useState([]);
  const [loansByType, setLoansByType] = useState([]);
  const [collections, setCollections] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, monthData, typeData, collectionsData, loansData, financialData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getLoansByMonth(),
          dashboardService.getLoansByType(),
          dashboardService.getCollections(),
          prestamoService.getAll(),
          expenseService.getSummary(),
        ]);
        setStats(statsData);
        setLoansByMonth(monthData);
        setLoansByType(typeData);
        setCollections(collectionsData);
        setAllLoans(loansData);
        setFinancial(financialData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Cargando dashboard...</p></div>;
  }

  const getLoansForPeriod = (period) => {
    if (!period?.loanIds) return [];
    const idSet = new Set(period.loanIds.map(id => String(id)));
    return allLoans.filter(l => idSet.has(String(l.id)));
  };

  const freqColorMap = {
    diaria: 'bg-purple-50 border-purple-200',
    semanal: 'bg-green-50 border-green-200',
    quincenal: 'bg-warning-50 border-warning-200',
    mensual: 'bg-danger-50 border-red-200',
  };

  const freqTextColor = {
    diaria: 'text-purple-700',
    semanal: 'text-green-700',
    quincenal: 'text-warning-700',
    mensual: 'text-danger-700',
  };

  const mobileCurrency = getCurrency(stats?.monedasHabilitadas?.[0] || 'DOP');
  const mobileCurrencyCode = stats?.monedasHabilitadas?.[0] || 'DOP';
  const mobileCapital = stats?.capitalDisponiblePorMoneda?.[mobileCurrencyCode]
    ?? stats?.capitalDisponible
    ?? stats?.disponible
    ?? 0;
  const mobileMonths = loansByMonth.slice(-6);
  const maxMonthlyLoans = Math.max(1, ...mobileMonths.map((item) => Number(item.cantidad || 0)));

  return (
    <div>
      <section className="flex min-h-[calc(100vh-5rem)] flex-col gap-3 px-0 pb-3 md:hidden">
        <div className="px-4 pt-1 sm:px-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-warning-700">Vista ejecutiva</p>
          <h1 className="mt-0.5 font-display text-[28px] font-extrabold leading-tight tracking-tight text-navy-900">Estado de cartera</h1>
          <p className="text-[13.5px] text-navy-900/70">Capital, colocación y cobranza.</p>
        </div>

        <section className="rounded-16 bg-navy-900 p-5 text-surface-canvas shadow-card-lg">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-warning-500">Liquidez · Capital disponible</p>
          <div className="mt-2 flex items-center gap-3"><CurrencyFlag currency={mobileCurrency} className="h-[22px] w-8" /><div><p className="text-xs text-white/70">{mobileCurrencyCode} · {mobileCurrency.name}</p><p className="font-display text-[28px] font-extrabold leading-tight">{formatMoney(mobileCapital, mobileCurrencyCode)}</p></div></div>
          <p className="mt-2 text-[11px] text-white/55">Los saldos nunca se mezclan entre divisas.</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {[['EN CARTERA', stats?.enCartera || 0, 'préstamos'], ['INTERESES', `$${Number(financial?.totalIngresos || 0).toLocaleString()}`, ''], ['UTILIDAD NETA', `$${Number(financial?.utilidadNeta || 0).toLocaleString()}`, ''], ['MARGEN', `${financial?.margenPorcentaje || 0}%`, '']].map(([label, value, note]) => <div key={label} className="rounded-12 border border-surface-border bg-white p-3.5 shadow-card"><p className="text-[10px] font-bold tracking-[0.1em] text-slate-500">{label}</p><p className="mt-0.5 font-display text-2xl font-extrabold text-navy-900">{value}</p><p className="text-[11.5px] text-navy-900/60">{note}</p></div>)}
        </div>

        <section className="rounded-16 border border-surface-border bg-white p-4 shadow-card">
          <p className="mb-1 font-bold text-navy-900">Préstamos por mes <span className="text-[11px] font-normal text-navy-900/55">· ejemplo</span></p>
          <div className="flex h-28 items-end justify-between gap-2 pt-2">
            {(mobileMonths.length ? mobileMonths : [{ mes: '—', cantidad: 0 }]).map((item) => <div key={item.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><div className="w-full max-w-8 rounded-t-6 bg-warning-500" style={{ height: `${Math.max(8, (Number(item.cantidad || 0) / maxMonthlyLoans) * 88)}px` }} /><span className="text-[10px] text-slate-500">{item.mes}</span></div>)}
          </div>
        </section>
      </section>

      <section className="hidden md:block">
      <div className="mb-8 flex flex-col gap-3 border-b border-surface-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-600">Vista ejecutiva</p><h1 className="mt-1 font-display text-3xl font-extrabold text-navy-800">Estado de cartera</h1><p className="mt-1 text-sm text-slate-500">Capital, colocación y cobranza en una sola lectura.</p></div>
        <div className="w-fit rounded-full border border-success-500/20 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700">Operación sincronizada</div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="order-2 lg:order-1">
          <section className="h-full rounded-16 bg-navy-900 p-6 text-white shadow-card sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-warning-500">Liquidez</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Capital disponible por moneda</h2>
            <p className="mt-1 text-xs text-slate-300">Los saldos se mantienen separados; nunca se mezclan entre divisas.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(stats?.monedasHabilitadas?.length ? stats.monedasHabilitadas : ['DOP']).map((currency) => {
                const meta = getCurrency(currency);
                const value = stats?.capitalDisponiblePorMoneda?.[currency] ?? (currency === 'DOP' ? (stats?.capitalDisponible ?? stats?.disponible ?? 0) : 0);
                return <button type="button" key={currency} onClick={() => setSelectedCurrency(currency)} className="rounded-12 border border-white/10 bg-navy-800 p-4 text-left transition hover:-translate-y-0.5 hover:border-warning-500/60"><div className="flex items-center gap-2"><CurrencyFlag currency={meta} className="h-5 w-8" /><div><p className="text-xs font-semibold text-white">{currency} <span className="font-normal text-slate-400">· {meta.name}</span></p><p className="mt-1 font-display text-2xl font-extrabold text-white">{formatMoney(value, currency)}</p></div></div><p className="mt-3 text-[11px] font-semibold text-warning-500">Ver resumen en {currency} →</p></button>;
              })}
            </div>
          </section>
        </div>
        <div className="order-1 lg:order-2"><KPICard title="Total en cartera" value={stats?.enCartera || 0} icon={Users} color="warning" /></div>
      </div>

      {selectedCurrency && (() => { const loans = allLoans.filter((loan) => (loan.moneda || 'DOP') === selectedCurrency); const total = loans.reduce((sum, loan) => sum + Number(loan.monto || 0), 0); const cobrar = loans.reduce((sum, loan) => sum + Number(loan.saldoPendiente || 0), 0); const intereses = loans.reduce((sum, loan) => sum + Math.max(0, Number(loan.saldoPendiente || 0) - Number(loan.monto || 0)), 0); const meta = getCurrency(selectedCurrency); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4" onClick={() => setSelectedCurrency(null)}><div className="w-full max-w-xl rounded-16 bg-white p-6 shadow-card-lg" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><CurrencyFlag currency={meta} className="h-7 w-10" /><h3 className="mt-2 text-xl font-bold text-navy-800">Resumen en {selectedCurrency}</h3><p className="text-sm text-slate-500">{meta.name} · {loans.length} préstamo{loans.length === 1 ? '' : 's'}</p></div><button type="button" onClick={() => setSelectedCurrency(null)} className="rounded-8 p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={20} /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-12 bg-surface-canvas p-4"><p className="text-xs text-slate-400">Total prestado</p><p className="mt-2 text-lg font-bold text-navy-500">{formatMoney(total, selectedCurrency)}</p></div><div className="rounded-12 bg-success-50 p-4"><p className="text-xs text-success-700">Total por cobrar</p><p className="mt-2 text-lg font-bold text-success-700">{formatMoney(cobrar, selectedCurrency)}</p></div><div className="rounded-12 bg-accent-50 p-4"><p className="text-xs text-accent-700">Interés estimado</p><p className="mt-2 text-lg font-bold text-accent-700">{formatMoney(intereses, selectedCurrency)}</p></div></div><p className="mt-5 text-xs text-slate-400">Los préstamos se contabilizan únicamente dentro de su propia divisa.</p></div></div>; })()}

      {financial && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPICard title="Ingresos Intereses" value={`$${(financial.totalIngresos || 0).toLocaleString()}`} icon={DollarSign} color="success" />
          <KPICard title="Gastos Totales" value={`$${(financial.totalGastos || 0).toLocaleString()}`} icon={TrendingDown} color="danger" />
          <KPICard title="Utilidad Neta" value={`$${(financial.utilidadNeta || 0).toLocaleString()}`} icon={Wallet} color="accent" />
          <KPICard title="Margen" value={`${financial.margenPorcentaje || 0}%`} icon={TrendingUp} color="navy" />
        </div>
      )}

      {collections?.periodos && collections.periodos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-500">Cobranza Estimada por Período</h2>
            <p className="text-sm font-semibold text-navy-500">
              Total: <span className="text-accent-500">${(collections.totalCobranzaPeriodo || 0).toLocaleString()}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.periodos.map((p) => (
              <button
                key={p.frecuencia}
                onClick={() => setSelectedPeriod(p)}
                disabled={p.montoEstimado <= 0}
                className={`text-left rounded-12 p-5 border shadow-card transition-all hover:shadow-card-lg ${freqColorMap[p.frecuencia] || 'bg-white border-surface-border'} disabled:opacity-50 disabled:cursor-default`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${freqTextColor[p.frecuencia] || 'text-slate-500'}`}>
                    {freqLabel[p.frecuencia] || p.frecuencia}
                  </span>
                  <CalendarClock size={16} className="opacity-50" />
                </div>
                <p className="text-xs text-slate-400 mb-1">{p.etiqueta}</p>
                <p className={`text-xl font-bold ${freqTextColor[p.frecuencia] || 'text-navy-500'}`}>
                  ${(p.montoEstimado || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {p.cuotasPendientes} cuota{p.cuotasPendientes !== 1 ? 's' : ''} pendiente{p.cuotasPendientes !== 1 ? 's' : ''}
                </p>
                {p.montoEstimado > 0 && (
                  <div className="flex items-center gap-1 text-accent-500 text-xs font-semibold mt-3">
                    Ver préstamos <ArrowRight size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal de préstamos por período */}
      {selectedPeriod && (
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onClick={() => setSelectedPeriod(null)}>
          <div className="bg-white rounded-16 shadow-card-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-bold text-navy-500">
                  Cobranza {freqLabel[selectedPeriod.frecuencia]}
                </h3>
                <p className="text-sm text-slate-400">{selectedPeriod.etiqueta} — {selectedPeriod.cuotasPendientes} cuotas por ${(selectedPeriod.montoEstimado || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedPeriod(null)} className="p-2 hover:bg-surface-hover rounded-8 transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {getLoansForPeriod(selectedPeriod).length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay préstamos pendientes en este período.</p>
              ) : (
                <div className="space-y-4">
                  {getLoansForPeriod(selectedPeriod).map((loan) => (
                    <div key={loan.id} className="p-5 bg-surface-canvas rounded-12 border border-surface-border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-base font-bold text-navy-500">{loan.cliente}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            {loan.cedula && <span className="font-mono">{loan.cedula}</span>}
                            {loan.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {loan.telefono}
                              </span>
                            )}
                            {loan.email && (
                              <span className="flex items-center gap-1">
                                <Mail size={12} /> {loan.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={loan.estado} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Préstamo</p>
                          <p className="text-sm font-semibold text-navy-500">${Number(loan.monto || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cuota</p>
                          <p className="text-sm font-semibold text-navy-500">${Number(loan.cuotaMensual || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pendiente</p>
                          <p className="text-sm font-bold text-accent-500">${Number(loan.saldoPendiente || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tasa</p>
                          <p className="text-sm font-semibold text-navy-500">{Number(loan.tasa || 0)}% anual</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-surface-border">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Inicio: {loan.fechaInicio ? formatDateOnly(loan.fechaInicio) : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Vence: {loan.fechaVencimiento ? formatDateOnly(loan.fechaVencimiento) : '-'}
                        </span>
                        <span>{loan.plazo} meses</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-12 p-6 shadow-card border border-surface-border lg:col-span-2">
          <h3 className="text-base font-bold text-navy-500 mb-4">Préstamos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loansByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7edf6" />
              <XAxis dataKey="mes" stroke="#a6bbd1" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a6bbd1" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#006bff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-12 p-6 shadow-card border border-surface-border">
          <h3 className="text-base font-bold text-navy-500 mb-4">Por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={loansByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valor">
                {loansByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {loansByType.map((item, index) => (
              <div key={item.nombre} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-slate-500">{item.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
