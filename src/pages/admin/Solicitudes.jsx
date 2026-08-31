import { useState, useEffect, useMemo, useRef } from 'react';
import { Link2, Check, QrCode, Copy, Download, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../../components/StatusBadge';
import SolicitudDetailModal from '../../components/modals/SolicitudDetailModal';
import { solicitudService } from '../../services/solicitudService';
import { useAuth } from '../../context/AuthContext';
import CurrencyFlag from '../../components/CurrencyFlag';
import { getCurrency } from '../../data/currencies';

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

const formatMoney = (value, currency = 'DOP') => new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(Number(value || 0));

export default function Solicitudes() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrDownloading, setQrDownloading] = useState(false);
  const [actionError, setActionError] = useState('');
  const qrRef = useRef(null);

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

  const handleDownloadQr = async () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || qrDownloading) return;
    setQrDownloading(true);
    try {
      const serialized = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
      const objectUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      const scale = 4;
      canvas.width = 144 * scale;
      canvas.height = 144 * scale;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `prestamoplus-qr-solicitudes-${tenantId.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('No se pudo exportar el QR:', err);
    } finally {
      setQrDownloading(false);
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
    const map = { 0: 'pendiente', 1: 'procesando', 2: 'aprobada', 3: 'negada', 4: 'cancelada' };
    const value = map[estado] || String(estado || '').toLowerCase();
    return value === 'enrevision' || value === 'en_revision' ? 'procesando' : value;
  };

  const filtered = solicitudes.filter((s) => {
    if (filtro === 'todos') return true;
    return estadoToLabel(s.estado) === filtro;
  });

  const handleAprobar = async (id, approvalTerms) => {
    try {
      await solicitudService.updateEstado(id, 'Aprobada', approvalTerms);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: 'aprobada' } : s)));
      setSelectedSolicitud(null);
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleProcesar = async (id, instrucciones, terms = {}) => {
    try {
      setActionError('');
      await solicitudService.updateEstado(id, 'Procesando', { instrucciones, ...terms });
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: 'procesando' } : s)));
      setSelectedSolicitud((prev) => prev ? { ...prev, estado: 'procesando' } : null);
    } catch (err) {
      console.error('Error processing:', err);
      setActionError(err.response?.status === 403 ? 'Tu autorización para aprobar solicitudes expiró. Vuelve a iniciar sesión una vez y podrás continuar con el lote.' : (err.response?.data?.message || 'No se pudo procesar la solicitud.'));
    }
  };

  const handleRechazar = async (id, desestimar = false) => {
    try {
      await solicitudService.updateEstado(id, desestimar ? 'Cancelada' : 'Negada', desestimar ? { instrucciones: 'Solicitud desestimada por el administrador.' } : {});
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: desestimar ? 'cancelada' : 'negada' } : s)));
      setSelectedSolicitud(null);
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  const handleDesestimar = async (id) => {
    if (!window.confirm('¿Desestimar esta solicitud sin procesarla?')) return;
    try {
      await solicitudService.updateEstado(id, 'Cancelada', { instrucciones: 'Solicitud desestimada por el administrador.' });
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: 'cancelada' } : s)));
      setSelectedSolicitud(null);
    } catch (err) { console.error('Error desestimando:', err); }
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-8">Cargando solicitudes...</p>;
  }

  return (
    <div>
      {actionError && <div role="alert" className="fixed left-1/2 top-5 z-[80] w-[min(92vw,680px)] -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-xl">{actionError}</div>}
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
            <option value="procesando">Procesando</option>
            <option value="aprobada">Aprobadas</option>
            <option value="negada">Negadas</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium">
            {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
            {linkCopied ? 'Link copiado' : 'Copiar link de solicitud'}
          </button>
        </div>
      </div>

      {tenantId && (
        <section className="mb-8 flex flex-col gap-5 rounded-16 border border-surface-border bg-white p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
          <button ref={qrRef} type="button" onClick={handleDownloadQr} title="Descargar QR en PNG" className="group relative shrink-0 rounded-12 border border-surface-border bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-accent-300">
            <QRCodeSVG value={solicitudUrl} size={144} level="H" includeMargin fgColor="#0b3558" />
            <span className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-8 bg-navy-500/85 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {qrDownloading ? <Loader2 size={25} className="animate-spin" /> : <Download size={25} />}
              <span className="sr-only">Descargar QR en PNG</span>
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-accent-600"><QrCode size={18} /><span className="text-xs font-bold uppercase tracking-wider">QR estático de solicitudes</span></div>
            <h2 className="text-lg font-bold text-navy-500">Un código para tus redes y sucursales</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Este QR es permanente y exclusivo de tu empresa. Todas las solicitudes recibidas desde él llegarán a este tenant.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded-8 bg-surface-fill px-3 py-2 text-xs text-slate-500">{solicitudUrl}</code>
              <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 rounded-8 border border-surface-border px-3 py-2 text-xs font-semibold text-navy-500 hover:bg-surface-hover"><Copy size={14} /> Copiar enlace</button>
              <button onClick={handleDownloadQr} disabled={qrDownloading} className="inline-flex items-center gap-1.5 rounded-8 border border-accent-200 px-3 py-2 text-xs font-semibold text-accent-600 hover:bg-accent-50 disabled:opacity-60"><Download size={14} /> {qrDownloading ? 'Preparando PNG…' : 'Descargar PNG'}</button>
            </div>
          </div>
        </section>
      )}

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
                <p className="flex items-center gap-2 font-semibold text-gray-900"><CurrencyFlag currency={getCurrency(s.moneda)} /> {formatMoney(s.montoSolicitado, String(s.moneda || 'DOP').toUpperCase())}</p>
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
                <p className="flex items-center gap-2 font-semibold text-gray-900"><CurrencyFlag currency={getCurrency(s.moneda)} /> {formatMoney(s.cuotaEstimada, String(s.moneda || 'DOP').toUpperCase())}</p>
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
          onProcess={handleProcesar}
          onReject={handleRechazar}
        />
      )}
    </div>
  );
}
