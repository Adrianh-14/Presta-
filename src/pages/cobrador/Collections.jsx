import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Calendar, DollarSign, QrCode } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import GenerateQRModal from '../../components/modals/GenerateQRModal';
import { collectorPortalService } from '../../services/cobradorService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const freqLabel = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState({ open: false, assignment: null });
  const [locationSessions, setLocationSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await collectorPortalService.getCollections();
        setCollections(data);
        const sessions = await collectorPortalService.getMyLocationSessions();
        setLocationSessions(sessions);
      } catch (err) {
        console.error('Error loading collections:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = collections.filter(c =>
    c.clienteNombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.clienteCedula?.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Cargando cobros...</p></div>;

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cobranza</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Cobros de hoy</h1>
        <p className="mt-1 text-sm text-slate-500">Préstamos asignados para tu ruta de cobranza</p>
      </div>

      <div className="mb-6 rounded-16 border border-surface-border bg-white shadow-card">
        <div className="p-4 border-b border-surface-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-center py-8 col-span-full">No hay cobros asignados</p>
          ) : filtered.map((c) => (
            <div key={c.id} className="p-5 bg-surface-canvas rounded-12 border border-surface-border hover:shadow-card transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-bold text-navy-500">{c.clienteNombre}</p>
                  <p className="text-xs text-slate-400">{c.clienteCedula}</p>
                </div>
                {c.ultimoResultado && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600">
                    {c.ultimoResultado}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Préstamo</p>
                  <p className="text-sm font-semibold text-navy-500">{fmt(c.montoOriginal)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Cuota</p>
                  <p className="text-sm font-semibold text-navy-500">{fmt(c.cuotaMensual)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Saldo</p>
                  <p className="text-sm font-bold text-accent-500">{fmt(c.saldoPendiente)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Frecuencia</p>
                  <p className="text-sm text-navy-500">{freqLabel[c.frecuencia] || c.frecuencia}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Phone size={12} /> {c.clienteTelefono}</span>
              </div>

              <div className="flex gap-2">
                {locationSessions.some((session) => String(session.loanId) === String(c.loanId) && session.latitude != null && session.longitude != null) && <button onClick={() => { const session = locationSessions.find((item) => String(item.loanId) === String(c.loanId)); window.open(`https://www.google.com/maps/search/?api=1&query=${session.latitude},${session.longitude}`, '_blank', 'noopener,noreferrer'); }} className="flex items-center justify-center gap-1.5 rounded-8 border border-accent-200 px-3 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-50"><MapPin size={14} /> Ubicación</button>}
                {c.isQRAuthorized && (c.cuotasQRAutorizadas || []).length > 0 && <button onClick={() => setQrModal({ open: true, assignment: c })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-navy-500 text-white text-sm font-semibold rounded-8 hover:bg-navy-600 transition-all">
                  <QrCode size={14} /> QR
                </button>}
                <button onClick={() => navigate(`/cobrador/cobros/${c.id}`)}
                  className="flex-1 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all">
                  Registrar Visita
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <GenerateQRModal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, assignment: null })}
        assignment={qrModal.assignment || {}}
      />
    </div>
  );
}
