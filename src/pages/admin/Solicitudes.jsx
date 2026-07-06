import { useState, useEffect, useMemo } from 'react';
import { Link2, Check } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import SolicitudDetailModal from '../../components/modals/SolicitudDetailModal';
import { solicitudService } from '../../services/solicitudService';
import { useAuth } from '../../context/AuthContext';

function getTenantIdFromToken() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.tenantId || null;
  } catch {
    return null;
  }
}

export default function Solicitudes() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const tenantId = useMemo(() => user?.tenantId || getTenantIdFromToken(), [user]);
  const solicitudUrl = tenantId ? `${window.location.origin}/solicitud?tenant=${tenantId}` : '';

  const handleCopyLink = async () => {
    if (!solicitudUrl) return;
    try {
      await navigator.clipboard.writeText(solicitudUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = solicitudUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    setLoading(true);
    try {
      const data = await solicitudService.getAll();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error loading solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const estadoToLabel = (estado) => {
    const map = { 0: 'pendiente', 1: 'aprobada', 2: 'rechazada' };
    return map[estado] || String(estado || '').toLowerCase();
  };

  const filtered = solicitudes.filter((s) => {
    if (filtro === 'todos') return true;
    return estadoToLabel(s.estado) === filtro;
  });

  const handleAprobar = async (id, fechaInicio) => {
    try {
      await solicitudService.updateEstado(id, 'Aprobada', fechaInicio);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: 'aprobada' } : s)));
      setSelectedSolicitud(null);
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleRechazar = async (id) => {
    try {
      await solicitudService.updateEstado(id, 'Rechazada');
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: 'rechazada' } : s)));
      setSelectedSolicitud(null);
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-8">Cargando solicitudes...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <p className="text-gray-500">{solicitudes.filter((s) => estadoToLabel(s.estado) === 'pendiente').length} pendientes de revisión</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium"
        >
          {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
          {linkCopied ? 'Link copiado' : 'Copiar link de solicitud'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedSolicitud(s)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{s.client?.nombre}</h3>
                <p className="text-sm text-gray-500">{s.client?.email}</p>
              </div>
              <StatusBadge status={s.estado} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Monto solicitado</p>
                <p className="font-semibold text-gray-900">${Number(s.montoSolicitado || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plazo</p>
                <p className="font-semibold text-gray-900">{s.plazo} meses</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-semibold text-gray-900">{s.tipoPrestamo === 'personal' || s.tipoPrestamo === 0 ? 'Personal' : 'Garantía'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuota estimada</p>
                <p className="font-semibold text-gray-900">${Number(s.cuotaEstimada || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Fecha: {s.fechaSolicitud ? new Date(s.fechaSolicitud).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedSolicitud && (
        <SolicitudDetailModal
          solicitud={selectedSolicitud}
          onClose={() => setSelectedSolicitud(null)}
          onApprove={handleAprobar}
          onReject={handleRechazar}
        />
      )}
    </div>
  );
}
