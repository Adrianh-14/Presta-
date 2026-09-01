import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function LocationConsent() {
  const [terms, setTerms] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const watchId = useRef(null);
  useEffect(() => { Promise.all([api.get('/api/location/terms'), api.get('/api/location/consent/status')]).then(([termsResponse, statusResponse]) => { setTerms(termsResponse.data); setSaved(Boolean(statusResponse.data.active)); }).catch(() => setError('No se pudieron cargar los términos.')); }, []);
  useEffect(() => {
    let active = true;
    const poll = async () => { try { const { data } = await api.get('/api/location/my-session'); if (active && data) setSession(data); } catch { /* sesión aún no iniciada */ } };
    poll(); const timer = window.setInterval(poll, 15000);
    return () => { active = false; window.clearInterval(timer); if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); };
  }, []);
  useEffect(() => {
    if (!session || !navigator.geolocation) return undefined;
    watchId.current = navigator.geolocation.watchPosition(({ coords }) => api.post(`/api/location/sessions/${session.sessionId}/position`, { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }).catch(() => {}), () => setError('No se pudo obtener la ubicación. Revisa el permiso del dispositivo.'), { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [session]);
  const grant = async () => { setError(''); try { await api.post('/api/location/consent', { deviceId: navigator.userAgent.slice(0, 180) }); setSaved(true); } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo registrar la autorización.'); } };
  const revoke = async () => { setError(''); try { await api.post('/api/location/consent/revoke'); setSaved(false); setSession(null); } catch (requestError) { setError(requestError.response?.data?.message || 'No se pudo revocar la autorización.'); } };
  return <div className="mx-auto max-w-3xl"><div className="mb-8"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-12 bg-accent-50 text-accent-600"><MapPin size={24} /></div><h1 className="text-2xl font-bold text-navy-500">Autorización de ubicación para una visita</h1><p className="mt-1 text-sm text-slate-500">Esta autorización es independiente de los términos generales y puedes revocarla.</p></div><section className="rounded-16 border border-surface-border bg-white p-6 shadow-card"><div className="flex gap-3 rounded-12 border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800"><ShieldCheck className="mt-0.5 shrink-0" size={18} /><p>La ubicación solo se utilizará para coordinar una gestión de cobro activa, con un cobrador asignado y por tiempo limitado. No se habilita seguimiento permanente.</p></div><h2 className="mt-6 font-bold text-navy-500">Términos de ubicación</h2><p className="mt-3 whitespace-pre-line rounded-8 bg-surface-canvas p-4 text-sm leading-6 text-slate-600">{terms?.text || 'Cargando términos...'}</p><p className="mt-3 text-xs text-slate-400">Versión: {terms?.version || '—'}</p>{session && <div className="mt-5 rounded-8 border border-success-200 bg-success-50 p-4 text-sm font-semibold text-success-700"><MapPin size={17} className="mr-2 inline" />Sesión de ubicación activa hasta {new Date(session.expiresAt).toLocaleTimeString()}</div>}{error && <p className="mt-4 text-sm text-danger-600">{error}</p>}{!saved ? <><label className="mt-6 flex cursor-pointer gap-3 rounded-8 border border-surface-border p-4 text-sm text-slate-600"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" /><span>He leído y acepto expresamente estos términos de ubicación temporal, entiendo quién podrá consultar mi ubicación y sé que puedo revocar esta autorización.</span></label><button type="button" disabled={!accepted || !terms} onClick={grant} className="mt-5 rounded-8 bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Autorizar ubicación temporal</button></> : <div className="mt-6"><div className="flex items-center gap-2 rounded-8 bg-success-50 p-4 text-sm font-semibold text-success-700"><CheckCircle2 size={18} /> Autorización registrada.</div><button type="button" onClick={revoke} className="mt-3 rounded-8 border border-danger-200 px-4 py-2 text-sm font-semibold text-danger-600 hover:bg-danger-50">Revocar autorización y detener sesiones</button></div>}</section></div>;
}
