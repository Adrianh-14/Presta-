import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function LocationConsent() {
  const [terms, setTerms] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const watchId = useRef(null);

  useEffect(() => {
    let active = true;
    api.get('/api/location/terms')
      .then(({ data }) => { if (active) setTerms(data); })
      .catch(() => { if (active) setError('No se pudieron cargar los términos.'); });
    api.get('/api/location/consent/status', { useClientToken: true })
      .then(({ data }) => { if (active) setSaved(Boolean(data.active)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try { const { data } = await api.get('/api/location/my-session', { useClientToken: true }); if (active && data) setSession(data); } catch {}
    };
    poll();
    const timer = window.setInterval(poll, 15000);
    return () => { active = false; window.clearInterval(timer); if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); };
  }, []);

  useEffect(() => {
    if (!session || !navigator.geolocation) return undefined;
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => api.post(`/api/location/sessions/${session.sessionId}/position`, { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }, { useClientToken: true }).catch(() => {}),
      () => setError('No se pudo obtener la ubicación. Revisa el permiso del dispositivo.'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [session]);

  const grant = async () => {
    setError(''); setPermissionLoading(true);
    try {
      if (!navigator.geolocation) throw new Error('Este dispositivo no permite acceder a la ubicación.');
      await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Activa el permiso de ubicación del dispositivo para continuar.')), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
      await api.post('/api/location/consent', { deviceId: navigator.userAgent.slice(0, 180) }, { useClientToken: true });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo registrar la autorización.');
    } finally { setPermissionLoading(false); }
  };

  const revoke = async () => {
    setError('');
    try { await api.post('/api/location/consent/revoke', undefined, { useClientToken: true }); setSaved(false); setSession(null); }
    catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo revocar la autorización.'); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-12 bg-accent-50 text-accent-600"><MapPin size={22} /></div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Privacidad y cobros</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Autorización de ubicación</h1>
        <p className="mt-1 text-sm text-slate-500">Se registra una sola vez y permanece vigente hasta que la revoques.</p>
      </div>
      <section className="rounded-16 border border-surface-border bg-white p-6 shadow-card sm:p-7">
        <div className="flex gap-3 rounded-12 border border-warning-200 bg-warning-50 p-4 text-sm leading-6 text-warning-800"><ShieldCheck className="mt-0.5 shrink-0" size={18} /><p>La ubicación solo se utilizará en jornadas de cobro, con un préstamo y cobrador asignados, durante una sesión temporal. Tu portal, tus pagos y el pago por QR siguen disponibles sin activar una sesión.</p></div>
        <div className="mt-7"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">Condiciones</p><h2 className="mt-1 font-display text-xl font-extrabold text-navy-800">Términos de ubicación</h2></div>
        <p className="mt-3 whitespace-pre-line rounded-12 bg-surface-canvas p-4 text-sm leading-6 text-slate-600">{terms?.text || 'Cargando términos...'}</p>
        <p className="mt-3 text-xs text-slate-400">Versión: {terms?.version || '—'}</p>
        {session && <div className="mt-5 rounded-8 border border-success-200 bg-success-50 p-4 text-sm font-semibold text-success-700"><MapPin size={17} className="mr-2 inline" />Sesión de ubicación activa hasta {new Date(session.expiresAt).toLocaleTimeString()}</div>}
        {error && <p className="mt-4 text-sm text-danger-600">{error}</p>}
        {!saved ? <><label className="mt-6 flex cursor-pointer gap-3 rounded-8 border border-surface-border p-4 text-sm text-slate-600"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" /><span>He leído y acepto expresamente estos términos de ubicación para jornadas de cobro y entiendo quién podrá consultarla.</span></label><button type="button" disabled={!accepted || !terms || permissionLoading} onClick={grant} className="mt-5 rounded-8 bg-navy-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-700 disabled:opacity-50">{permissionLoading ? 'Solicitando permiso del dispositivo...' : 'Autorizar ubicación para cobros'}</button></> : <div className="mt-6"><div className="flex items-center gap-2 rounded-8 bg-success-50 p-4 text-sm font-semibold text-success-700"><CheckCircle2 size={18} /> Autorización registrada hasta revocación.</div><p className="mt-2 text-xs text-slate-500">El permiso del teléfono también debe permanecer activo para transmitir la ubicación durante una sesión.</p><button type="button" onClick={revoke} className="mt-3 rounded-8 border border-danger-200 px-4 py-2 text-sm font-semibold text-danger-600 hover:bg-danger-50">Revocar autorización y detener sesiones</button></div>}
      </section>
    </div>
  );
}
