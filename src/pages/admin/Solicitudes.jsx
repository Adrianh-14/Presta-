import { useState } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { solicitudes } from '../../data/mockData';

export default function Solicitudes() {
  const [filtro, setFiltro] = useState('todos');
  const [solicitudesData, setSolicitudesData] = useState(solicitudes);

  const solicitudesFiltradas = solicitudesData.filter((s) => {
    return filtro === 'todos' || s.estado === filtro;
  });

  const handleAprobar = (id) => {
    setSolicitudesData(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'aprobada' } : s
    ));
  };

  const handleRechazar = (id) => {
    setSolicitudesData(prev => prev.map(s => 
      s.id === id ? { ...s, estado: 'rechazada' } : s
    ));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <p className="text-gray-500">{solicitudesData.filter(s => s.estado === 'pendiente').length} pendientes de revisión</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {solicitudesFiltradas.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{s.cliente}</h3>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
              <StatusBadge status={s.estado} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Monto solicitado</p>
                <p className="font-semibold text-gray-900">${s.monto.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plazo</p>
                <p className="font-semibold text-gray-900">{s.plazo} meses</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-semibold text-gray-900">{s.tipo === 'personal' ? 'Personal' : 'Garantía'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingreso mensual</p>
                <p className="font-semibold text-gray-900">${s.ingresoMensual.toLocaleString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <p>Empresa: {s.empresa}</p>
              <p>Fecha: {s.fechaSolicitud}</p>
            </div>

            {s.estado === 'pendiente' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleAprobar(s.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                  Aprobar
                </button>
                <button
                  onClick={() => handleRechazar(s.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={16} />
                  Rechazar
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye size={16} />
                  Ver detalles
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
