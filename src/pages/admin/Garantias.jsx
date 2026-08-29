import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, FolderOpen, Image as ImageIcon, Loader2, Upload, FileText } from 'lucide-react';
import { solicitudService } from '../../services/solicitudService';
import api from '../../services/api';

export default function Garantias() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const uploadContract = async (applicationId, file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) { window.alert('Usa un PDF, JPG o PNG de hasta 10 MB.'); return; }
    setUploading(applicationId);
    try { const body = new FormData(); body.append('file', file); await api.post(`/api/media/loan-application/${applicationId}/contract`, body); const refreshed = await solicitudService.getAll(); setSolicitudes(refreshed); }
    catch (error) { window.alert(error.response?.data?.message || 'No se pudo subir el contrato.'); }
    finally { setUploading(null); }
  };
  useEffect(() => {
    solicitudService.getAll().then(setSolicitudes).catch(console.error).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      const entries = await Promise.all(solicitudes.filter(s => s.verificationMedia?.garantiaPath).map(async (s) => {
        try { const { data } = await api.get(`/api/media/${s.verificationMedia.garantiaPath}`, { responseType: 'blob' }); return [s.id, URL.createObjectURL(data)]; } catch { return [s.id, null]; }
      }));
      if (active) setImages(Object.fromEntries(entries));
    };
    if (solicitudes.length) loadImages();
    return () => { active = false; Object.values(images).forEach(url => url && URL.revokeObjectURL(url)); };
  }, [solicitudes]);
  const grouped = useMemo(() => solicitudes.filter(s => s.verificationMedia?.garantiaPath).reduce((map, s) => { const key = s.client?.id || s.client?.cedula || s.id; (map[key] ||= { client: s.client, loans: [] }).loans.push(s); return map; }, {}), [solicitudes]);
  return <div>
    <div className="mb-8 flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-12 bg-accent-100 text-accent-600"><ShieldCheck size={22} /></div><div><h1 className="text-2xl font-bold text-navy-500">Documentos y garantías</h1><p className="text-sm text-slate-500">Carpetas por cliente y subcarpetas por cada préstamo. Guarda contratos firmados en PDF, JPG o PNG.</p></div></div>
    {loading ? <div className="flex justify-center py-14"><Loader2 className="animate-spin text-accent-500" /></div> : Object.keys(grouped).length === 0 ? <div className="rounded-16 border border-dashed border-surface-border bg-white px-6 py-14 text-center shadow-card"><FolderOpen className="mx-auto mb-3 text-slate-300" size={34} /><h2 className="font-bold text-navy-500">Aún no hay documentos</h2><p className="mt-1 text-sm text-slate-500">Las garantías y contratos aparecerán aquí vinculados a cada préstamo.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Object.values(grouped).map(folder => <article key={folder.client?.id} className="rounded-16 border border-surface-border bg-white p-5 shadow-card"><div className="mb-4 flex items-center gap-3"><FolderOpen className="text-warning-500" size={23} /><div><h2 className="font-bold text-navy-500">{folder.client?.nombre || 'Cliente'}</h2><p className="text-xs text-slate-400">{folder.loans.length} préstamo{folder.loans.length === 1 ? '' : 's'}</p></div></div><div className="space-y-3">{folder.loans.map(s => <div key={s.id} className="rounded-12 bg-surface-fill p-3"><div className="flex items-center gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-8 bg-white">{images[s.id] ? <img src={images[s.id]} alt="Garantía" className="h-full w-full object-cover" /> : <ImageIcon className="m-5 text-slate-300" size={24} />}</div><div className="min-w-0"><p className="text-sm font-semibold text-navy-500">Préstamo {String(s.id).slice(0, 8)}</p><p className="text-xs text-slate-500">{s.moneda || 'DOP'} {Number(s.montoSolicitado || 0).toLocaleString()} · {s.estado}</p><p className="text-[11px] text-slate-400">{s.fechaSolicitud ? new Date(s.fechaSolicitud).toLocaleDateString('es-DO') : ''}</p></div></div><div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">{s.verificationMedia?.contratoPath ? <a href={`/api/media/${s.verificationMedia.contratoPath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600"><FileText size={14} /> Ver contrato</a> : <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-accent-600"><Upload size={14} /> {uploading === s.id ? 'Subiendo…' : 'Subir contrato'}<input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={uploading === s.id} onChange={(event) => uploadContract(s.id, event.target.files?.[0])} /></label>}<span className="text-[11px] text-slate-400">Garantía {s.verificationMedia?.garantiaPath ? 'recibida' : 'pendiente'}</span></div></div>)}</div></article>)}</div>}
  </div>;
}
