import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { solicitudService } from '../../services/solicitudService';

const money = (value, currency = 'DOP') => new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(Number(value || 0));
const frecuencia = { 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual', diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

export default function SolicitudDecision() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const token = params.get('token');
  const [proposal, setProposal] = useState(null);
  const [message, setMessage] = useState('Cargando propuesta…');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id || !token) { setMessage('Enlace inválido.'); return; }
    solicitudService.getDecision(id, token).then(setProposal).catch(() => setMessage('La propuesta no está disponible o el enlace expiró.'));
  }, [id, token]);

  const decide = async (approved) => {
    setSending(true);
    try {
      await solicitudService.decideAsClient(id, token, approved);
      setProposal(null);
      setMessage(approved ? 'Aprobación recibida. La empresa formalizará el préstamo.' : 'Has rechazado las condiciones de la propuesta.');
    } catch (error) { setMessage(error.response?.data?.message || 'No se pudo registrar tu respuesta.'); }
    finally { setSending(false); }
  };

  return <main className="min-h-screen bg-surface-fill px-4 py-10"><section className="mx-auto max-w-xl rounded-16 border border-surface-border bg-white p-6 shadow-card"><div className="mb-6 flex items-center gap-3"><img src="/branding/icono-bonexa.svg" alt="Bonexa" className="h-10 w-10 rounded-8" /><div><p className="font-display text-lg font-extrabold text-navy-800">Bonexa</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">Decisión de préstamo</p></div></div><h1 className="font-display text-2xl font-extrabold text-navy-800">Revisión de condiciones</h1>{proposal ? <><p className="mt-2 text-slate-600">Hola {proposal.cliente || 'cliente'}, revisa la propuesta enviada por la empresa.</p><div className="mt-6 space-y-3 rounded-12 bg-surface-fill p-4 text-sm"><p><b>Monto:</b> {money(proposal.montoSolicitado, proposal.moneda)}</p><p><b>Cuota estimada:</b> <span className="text-lg font-bold text-accent-700">{money(proposal.cuotaEstimada, proposal.moneda)}</span></p><p><b>Frecuencia de pago:</b> {frecuencia[String(proposal.frecuenciaPago).toLowerCase()] ?? frecuencia[proposal.frecuenciaPago] ?? proposal.frecuenciaPago}</p><p><b>Frecuencia de la tasa:</b> {frecuencia[String(proposal.frecuenciaInteres).toLowerCase()] ?? frecuencia[proposal.frecuenciaInteres] ?? proposal.frecuenciaInteres}</p><p><b>Tasa:</b> {proposal.tasaInteresMensual}%</p><p><b>Plazo:</b> {proposal.plazo} {Number(proposal.unidadPlazo) === 1 ? 'años' : 'meses'}</p><p><b>Gasto de cierre:</b> {proposal.gastoCierrePorcentaje}%</p></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={sending} onClick={() => decide(true)} className="flex-1 rounded-8 bg-success-600 px-4 py-3 font-semibold text-white"><Check className="mr-2 inline" size={18} />Aceptar condiciones</button><button disabled={sending} onClick={() => decide(false)} className="flex-1 rounded-8 bg-danger-600 px-4 py-3 font-semibold text-white"><X className="mr-2 inline" size={18} />Rechazar</button></div></> : <p className="mt-5 text-slate-600">{message}</p>}</section></main>;
}
