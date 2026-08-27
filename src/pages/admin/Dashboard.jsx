import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Users, TrendingUp, TrendingDown, CalendarClock, X, ArrowRight, Phone, Mail, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import StatusBadge from '../../components/StatusBadge';
import { dashboardService } from '../../services/dashboardService';
import { prestamoService } from '../../services/prestamoService';
import { expenseService } from '../../services/expenseService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const freqLabel = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loansByMonth, setLoansByMonth] = useState([]);
  const [loansByType, setLoansByType] = useState([]);
  const [collections, setCollections] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dashboard</h1>
        <p className="text-slate-400 text-sm">Resumen general del sistema de préstamos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Prestado" value={`$${(stats?.totalPrestado || 0).toLocaleString()}`} icon={DollarSign} color="navy" />
        <KPICard title="Capital disponible" value={`$${(stats?.capitalDisponible ?? stats?.disponible ?? 0).toLocaleString()}`} icon={Wallet} color="success" />
        <KPICard title="En Cartera" value={stats?.enCartera || 0} icon={Users} color="warning" />
        <KPICard title="Por Cobrar" value={`$${(stats?.porCobrar || 0).toLocaleString()}`} icon={TrendingUp} color="danger" />
      </div>

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPeriod(null)}>
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
                          <Calendar size={12} /> Inicio: {loan.fechaInicio ? new Date(loan.fechaInicio).toLocaleDateString() : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Vence: {loan.fechaVencimiento ? new Date(loan.fechaVencimiento).toLocaleDateString() : '-'}
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
    </div>
  );
}
