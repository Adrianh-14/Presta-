import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, Send } from 'lucide-react';
import { collectorPortalService } from '../../services/cobradorService';

const visitTypes = [
  { value: 'cobroExitoso', label: 'Cobro Exitoso', color: 'bg-success-50 border-success-200 text-success-700' },
  { value: 'cobroParcial', label: 'Cobro Parcial', color: 'bg-warning-50 border-warning-200 text-warning-700' },
  { value: 'noEncontrado', label: 'No Encontrado', color: 'bg-slate-50 border-slate-200 text-slate-600' },
  { value: 'rechazado', label: 'Rechazado', color: 'bg-danger-50 border-danger-200 text-danger-700' },
  { value: 'clienteAusente', label: 'Cliente Ausente', color: 'bg-slate-50 border-slate-200 text-slate-600' },
];

const tipoMap = { cobroExitoso: 0, cobroParcial: 1, noEncontrado: 2, rechazado: 3, clienteAusente: 4 };

export default function VisitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    collectorPortalService.getCollections()
      .then(data => setAssignment(data.find(item => item.id === id) || null))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false); },
        () => { setGpsLoading(false); }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipo) return;
    setSubmitting(true);
    try {
      await collectorPortalService.recordVisit(id, {
        tipoVisita: tipoMap[tipo],
        montoRecibido: parseFloat(monto) || 0,
        notas,
        latitud: gps?.lat,
        longitud: gps?.lng,
      });
      setSuccess(true);
      setTimeout(() => navigate('/cobrador/cobros'), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar visita');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="text-success-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-navy-500 mb-2">Visita Registrada</h2>
          <p className="text-slate-400 text-sm">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate('/cobrador/cobros')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-500 mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a mis cobros
      </button>

      <div className="bg-white rounded-16 shadow-card-lg p-6">
        <h2 className="text-lg font-bold text-navy-500 mb-6">Registrar Visita</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Resultado de la visita</label>
            <div className="grid grid-cols-2 gap-2">
              {visitTypes.map((vt) => (
                <button key={vt.value} type="button" onClick={() => setTipo(vt.value)}
                  className={`p-3 rounded-8 border text-sm font-semibold transition-all ${tipo === vt.value ? vt.color + ' ring-2 ring-offset-1' : 'border-surface-border text-slate-500 hover:bg-surface-hover'}`}>
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          {(tipo === 'cobroExitoso' || tipo === 'cobroParcial') && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Recibido</label>
              <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" placeholder="0.00" />
              {assignment && <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" onClick={() => setMonto(Number(assignment.cuotaMensual || 0).toFixed(2))}
                  className="px-3 py-1 bg-surface-fill hover:bg-surface-hover rounded-8 text-xs text-navy-500">
                  Cuota ${Number(assignment.cuotaMensual || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </button>
                <button type="button" onClick={() => setMonto(Number(assignment.saldoPendiente || 0).toFixed(2))}
                  className="px-3 py-1 bg-surface-fill hover:bg-surface-hover rounded-8 text-xs text-navy-500">
                  Saldo completo ${Number(assignment.saldoPendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </button>
              </div>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none resize-none"
              placeholder="Detalles de la visita..." />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} className={gps ? 'text-success-500' : 'text-slate-400'} />
            {gpsLoading ? 'Obteniendo ubicación...' : gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Sin ubicación'}
          </div>

          <button type="submit" disabled={!tipo || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
            <Send size={16} /> {submitting ? 'Enviando...' : 'Registrar Visita'}
          </button>
        </form>
      </div>
    </div>
  );
}
