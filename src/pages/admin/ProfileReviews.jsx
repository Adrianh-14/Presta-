import { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, MapPin, ShieldCheck, X } from 'lucide-react';
import api from '../../services/api';

export default function ProfileReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/clients/profile-updates/pending').then(({ data }) => setItems(data)).catch((e) => setError(e.response?.data?.message || 'No se pudieron cargar las solicitudes.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const review = async (item, approve) => {
    const note = notes[item.id] || '';
    if (!approve && !note.trim()) { setError('Escribe el motivo antes de rechazar una solicitud.'); return; }
    setBusy(item.id); setError('');
    try {
      await api.post(`/api/clients/profile-updates/${item.id}/review`, { approve, note });
      setItems((old) => old.filter((row) => row.id !== item.id));
    } catch (e) { setError(e.response?.data?.message || 'No se pudo procesar la solicitud.'); }
    finally { setBusy(''); }
  };
  const openEvidence = async (fileName) => {
    try {
      const { data } = await api.get(`/api/media/${encodeURIComponent(fileName)}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) { setError(e.response?.data?.message || 'No se pudo abrir el video de verificación.'); }
  };
  return <div className="mx-auto max-w-6xl">
    <header className="mb-7"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-600">Revisión de clientes</p><h1 className="mt-1 font-display text-3xl font-extrabold text-navy-800">Actualizaciones de perfil</h1><p className="mt-2 text-sm text-slate-500">Aprueba los datos propuestos antes de sustituir la información vigente.</p></header>
    {error && <div role="alert" className="mb-4 rounded-8 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading ? <p className="py-12 text-center text-slate-500">Cargando solicitudes…</p> : items.length === 0 ? <div className="rounded-12 border border-surface-border bg-white p-10 text-center shadow-card"><ShieldCheck className="mx-auto text-emerald-600" size={28}/><h2 className="mt-3 font-bold text-navy-700">Todo revisado</h2><p className="mt-1 text-sm text-slate-500">No hay actualizaciones pendientes.</p></div> : <div className="space-y-4">{items.map((item) => {
      const p = item.payload || {};
      return <article key={item.id} className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-border pb-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Solicitud de actualización</p><h2 className="mt-1 text-lg font-bold text-navy-800">{item.clientName}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13}/> Recibida {new Date(item.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pendiente</span></div>
        <div className="grid gap-5 py-5 md:grid-cols-2">
          <section><h3 className="text-sm font-bold text-navy-700">Domicilio propuesto</h3><p className="mt-2 flex gap-2 text-sm text-slate-600"><MapPin size={16} className="shrink-0 text-accent-600"/>{p.address?.direccion}, {p.address?.sector}, {p.address?.ciudad}, {p.address?.provincia}</p></section>
          <section><h3 className="text-sm font-bold text-navy-700">Información laboral</h3><p className="mt-2 text-sm text-slate-600">{p.workInformation?.empresa || 'Sin cambios'} · {p.workInformation?.cargo || ''}</p><p className="text-xs text-slate-500">Ingreso: {p.workInformation?.salario || '—'} · Antigüedad: {p.workInformation?.antiguedadAnios ?? '—'} años</p></section>
          <section><h3 className="text-sm font-bold text-navy-700">Garantes / referencias</h3>{p.references?.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{p.references.map((ref, i) => <li key={`${ref.telefono}-${i}`}>{ref.nombre} · {ref.telefono}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Sin referencias en la solicitud.</p>}</section>
          <section><h3 className="text-sm font-bold text-navy-700">Cuenta bancaria propuesta</h3>{p.bankAccount ? <p className="mt-2 text-sm text-slate-600">{p.bankAccount.banco} · {p.bankAccount.tipoCuenta === 1 ? 'Ahorro' : p.bankAccount.tipoCuenta === 2 ? 'Nómina' : 'Corriente'} · termina en {String(p.bankAccount.numeroCuenta || '').slice(-4)}</p> : <p className="mt-2 text-sm text-slate-500">Sin cambio de cuenta.</p>}</section>
          {p.videoPath && <section><h3 className="text-sm font-bold text-navy-700">Video nuevo</h3><button type="button" onClick={() => openEvidence(p.videoPath)} className="mt-2 text-sm font-semibold text-accent-700 underline">Revisar evidencia</button></section>}
        </div>
        <label className="block text-sm font-semibold text-navy-700">Nota de revisión<textarea value={notes[item.id] || ''} onChange={(event) => setNotes((old) => ({ ...old, [item.id]: event.target.value }))} rows={2} placeholder="Obligatoria si rechazas; el cliente la verá para corregir." className="auth-input mt-1"/></label>
        <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy === item.id} onClick={() => review(item, false)} className="inline-flex items-center gap-2 rounded-8 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><X size={16}/>Rechazar</button><button type="button" disabled={busy === item.id} onClick={() => review(item, true)} className="inline-flex items-center gap-2 rounded-8 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={16}/>{busy === item.id ? 'Procesando…' : 'Aprobar cambios'}</button></div>
      </article>;
    })}</div>}
  </div>;
}
