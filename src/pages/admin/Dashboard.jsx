import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import { dashboardService } from '../../services/dashboardService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loansByMonth, setLoansByMonth] = useState([]);
  const [loansByType, setLoansByType] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, monthData, typeData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getLoansByMonth(),
          dashboardService.getLoansByType(),
        ]);
        setStats(statsData);
        setLoansByMonth(monthData);
        setLoansByType(typeData);
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
