import { DollarSign, Wallet, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../components/KPICard';
import { kpis, graficoPrestamosPorMes, graficoPorTipo, prestamos } from '../../data/mockData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const prestamosProximosVencer = prestamos.filter(p => {
    if (p.estado !== 'activo') return false;
    const vencimiento = new Date(p.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes <= 30 && diasRestantes > 0;
  });

  const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido' || p.estado === 'mora');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general del sistema de préstamos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Prestado"
          value={`$${kpis.totalPrestado.toLocaleString()}`}
          icon={DollarSign}
          color="primary"
          change="12% vs mes anterior"
          changeType="positive"
        />
        <KPICard
          title="Disponible"
          value={`$${kpis.disponible.toLocaleString()}`}
          icon={Wallet}
          color="success"
        />
        <KPICard
          title="En Cartera"
          value={kpis.enCartera}
          icon={Users}
          color="warning"
        />
        <KPICard
          title="Por Cobrar"
          value={`$${kpis.porCobrar.toLocaleString()}`}
          icon={TrendingUp}
          color="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Préstamos por mes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Préstamos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graficoPrestamosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por tipo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={graficoPorTipo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="valor"
              >
                {graficoPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {graficoPorTipo.map((item, index) => (
              <div key={item.nombre} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-gray-600">{item.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos a vencer */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos a Vencer</h3>
          {prestamosProximosVencer.length === 0 ? (
            <p className="text-gray-500">No hay préstamos próximos a vencer</p>
          ) : (
            <div className="space-y-3">
              {prestamosProximosVencer.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.cliente}</p>
                    <p className="text-sm text-gray-500">Vence: {p.fechaVencimiento}</p>
                  </div>
                  <span className="font-semibold text-yellow-700">${p.saldoPendiente.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vencidos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vencidos y Mora</h3>
          {prestamosVencidos.length === 0 ? (
            <p className="text-gray-500">No hay préstamos vencidos</p>
          ) : (
            <div className="space-y-3">
              {prestamosVencidos.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.cliente}</p>
                    <p className="text-sm text-gray-500">{p.estado === 'mora' ? 'En mora' : 'Vencido'}</p>
                  </div>
                  <span className="font-semibold text-red-700">${p.saldoPendiente.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
