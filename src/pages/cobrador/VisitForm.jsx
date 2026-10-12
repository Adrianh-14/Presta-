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
      <div className="mx-auto flex min-h-[24rem] max-w-xl items-center justify-center rounded-16 border border-surface-border bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="text-success-500" size={32} />
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-success-700">Cobranza registrada</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy-800">Visita registrada</h2>
          <p className="mt-2 text-sm text-slate-500">Redirigiendo a tus cobros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => navigate('/cobrador/cobros')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-navy-800">
        <ArrowLeft size={16} /> Volver a mis cobros
      </button>

      <div className="rounded-16 border border-surface-border bg-white p-6 shadow-card sm:p-8">
        <div className="mb-7">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cobranza de campo</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy-800">Registrar visita</h1>
          <p className="mt-1 text-sm text-slate-500">Documenta el resultado y deja la cartera al día.</p>
          {assignment && <p className="mt-3 rounded-8 bg-surface-canvas px-3 py-2 text-xs font-semibold text-navy-700">{assignment.cliente || assignment.nombreCliente || 'Cliente asignado'}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-navy-700">Resultado de la visita</label>
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-navy-700">Monto recibido</label>
              <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)}
                className="auth-input w-full px-4 py-2.5 text-sm" placeholder="0.00" />
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-navy-700">Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
              className="auth-input w-full resize-none px-4 py-2.5 text-sm"
              placeholder="Detalles de la visita..." />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} className={gps ? 'text-success-500' : 'text-slate-400'} />
            {gpsLoading ? 'Obteniendo ubicación...' : gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Sin ubicación'}
          </div>

          <button type="submit" disabled={!tipo || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-8 bg-navy-800 px-4 py-3 text-sm font-bold text-white shadow-btn transition-all hover:bg-navy-700 disabled:opacity-50">
            <Send size={16} /> {submitting ? 'Enviando...' : 'Registrar visita'}
          </button>
        </form>
      </div>
    </div>
  );
}
