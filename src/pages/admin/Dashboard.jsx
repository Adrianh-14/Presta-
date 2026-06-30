import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Users, TrendingUp, CalendarClock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import { dashboardService } from '../../services/dashboardService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const COLLECTION_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const FREQ_ICONS = { diaria: CalendarClock, semanal: CalendarClock, quincenal: CalendarClock, mensual: CalendarClock };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loansByMonth, setLoansByMonth] = useState([]);
  const [loansByType, setLoansByType] = useState([]);
  const [collections, setCollections] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, monthData, typeData, collectionsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getLoansByMonth(),
          dashboardService.getLoansByType(),
          dashboardService.getCollections(),
        ]);
        setStats(statsData);
        setLoansByMonth(monthData);
        setLoansByType(typeData);
        setCollections(collectionsData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Cargando dashboard...</p></div>;
  }

  const freqColorMap = {
    diaria: 'bg-purple-50 border-purple-200 text-purple-700',
    semanal: 'bg-green-50 border-green-200 text-green-700',
    quincenal: 'bg-amber-50 border-amber-200 text-amber-700',
    mensual: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general del sistema de préstamos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Prestado" value={`$${(stats?.totalPrestado || 0).toLocaleString()}`} icon={DollarSign} color="primary" />
        <KPICard title="Disponible" value={`$${(stats?.disponible || 0).toLocaleString()}`} icon={Wallet} color="success" />
        <KPICard title="En Cartera" value={stats?.enCartera || 0} icon={Users} color="warning" />
        <KPICard title="Por Cobrar" value={`$${(stats?.porCobrar || 0).toLocaleString()}`} icon={TrendingUp} color="danger" />
      </div>

      {collections?.periodos && collections.periodos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cobranza Estimada por Período</h2>
            <p className="text-sm font-medium text-gray-700">
              Total: <span className="text-primary-600 font-bold">${(collections.totalCobranzaPeriodo || 0).toLocaleString()}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.periodos.map((p, i) => (
              <div
                key={p.frecuencia}
                className={`rounded-xl p-5 border ${freqColorMap[p.frecuencia] || 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {p.frecuencia}
                  </span>
                  <CalendarClock size={18} className="opacity-60" />
                </div>
                <p className="text-sm mb-1">{p.etiqueta}</p>
                <p className="text-2xl font-bold">${(p.montoEstimado || 0).toLocaleString()}</p>
                <p className="text-xs mt-1 opacity-70">
                  {p.cuotasPendientes} cuota{p.cuotasPendientes !== 1 ? 's' : ''} pendiente{p.cuotasPendientes !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Préstamos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loansByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Tipo</h3>
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
                <span className="text-sm text-gray-600">{item.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
