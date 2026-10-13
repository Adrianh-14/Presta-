import { useEffect, useState } from 'react';
import { X, QrCode, Loader2, Trash2, ShieldCheck } from 'lucide-react';
import { cobradorService, collectorPortalService } from '../../services/cobradorService';

const money = (value) => Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value) => value ? new Date(value).toLocaleDateString('es-DO') : '—';

export default function QRManagementModal({ collector, onClose }) {
  const [assignments, setAssignments] = useState([]);
  const [optionsByAssignment, setOptionsByAssignment] = useState({});
  const [selectedByAssignment, setSelectedByAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await collectorPortalService.getAssignments(collector.id);
        if (!active) return;
        setAssignments(data);
        const entries = await Promise.all(data.map(async assignment => [assignment.id, await collectorPortalService.getAdminQRInstallments(assignment.id)]));
        if (!active) return;
        const options = Object.fromEntries(entries);
        setOptionsByAssignment(options);
        setSelectedByAssignment(Object.fromEntries(data.map(a => [a.id, (options[a.id] || []).filter(i => i.isAuthorized && i.status !== 'Pagado').map(i => i.installmentNumber)])));
      } catch (error) {
        console.error('No se pudieron cargar las cuotas para autorización QR', error);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [collector.id]);

  const toggleInstallment = (assignmentId, installmentNumber) => {
    setSelectedByAssignment(prev => {
      const selected = new Set(prev[assignmentId] || []);
      selected.has(installmentNumber) ? selected.delete(installmentNumber) : selected.add(installmentNumber);
      return { ...prev, [assignmentId]: [...selected].sort((a, b) => a - b) };
    });
  };

  const handleSave = async (assignmentId) => {
    setSaving(assignmentId);
    try {
      await cobradorService.setQRInstallments(assignmentId, selectedByAssignment[assignmentId] || []);
      const refreshed = await collectorPortalService.getAdminQRInstallments(assignmentId);
      setOptionsByAssignment(prev => ({ ...prev, [assignmentId]: refreshed }));
      setAssignments(prev => prev.map(item => item.id === assignmentId ? { ...item, isQRAuthorized: (selectedByAssignment[assignmentId] || []).length > 0 } : item));
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudieron guardar las cuotas autorizadas.');
    } finally { setSaving(null); }
  };

  const handleRemove = async (assignment) => {
    if (!confirm(`¿Quitar el préstamo de ${assignment.clienteNombre} de este cobrador?`)) return;
    setRemoving(assignment.id);
    try { await cobradorService.removeAssignment(assignment.id); setAssignments(prev => prev.filter(item => item.id !== assignment.id)); }
    catch (error) { alert(error.userMessage || error.response?.data?.message || 'No se pudo quitar la asignación.'); }
    finally { setRemoving(null); }
  };

  return (
    <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onClick={onClose}>
      <div className="bg-white rounded-16 shadow-card-lg max-w-2xl w-full max-h-[88vh] flex flex-col" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div><h2 className="text-lg font-bold text-navy-500">Cuotas autorizadas para QR</h2><p className="text-sm text-slate-400">{collector.nombre} — Asigna exactamente qué cuotas puede cobrar.</p></div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-8"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-accent-500" /></div> : assignments.length === 0 ? <p className="py-8 text-center text-slate-400">No hay préstamos asignados.</p> : assignments.map(assignment => {
            const options = optionsByAssignment[assignment.id] || [];
            const selected = selectedByAssignment[assignment.id] || [];
            return <section key={assignment.id} className="overflow-hidden rounded-12 border border-surface-border">
              <div className="flex items-center justify-between gap-3 bg-surface-canvas px-4 py-3">
                <div><p className="font-semibold text-navy-500">{assignment.clienteNombre}</p><p className="text-xs text-slate-400">{assignment.clienteCedula} · Saldo {money(assignment.saldoPendiente)}</p></div>
                <button onClick={() => handleRemove(assignment)} disabled={removing === assignment.id || saving === assignment.id} title="Quitar préstamo" className="p-2 text-danger-500 hover:bg-danger-50 rounded-8 disabled:opacity-50">{removing === assignment.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
              </div>
              <div className="p-4">
                {options.length === 0 ? <p className="text-sm text-slate-400">Este préstamo no tiene cuotas pendientes para autorizar.</p> : <div className="space-y-2">
                  {options.map(option => <label key={option.installmentNumber} className={`flex cursor-pointer items-center gap-3 rounded-8 border p-3 ${selected.includes(option.installmentNumber) ? 'border-accent-300 bg-accent-50/50' : 'border-surface-border'} ${option.status === 'Pagado' ? 'opacity-50' : ''}`}>
                    <input type="checkbox" checked={selected.includes(option.installmentNumber)} disabled={option.status === 'Pagado'} onChange={() => toggleInstallment(assignment.id, option.installmentNumber)} className="h-4 w-4 accent-orange-500" />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-navy-500">Cuota #{option.installmentNumber} · {date(option.dueDate)}</span><span className="block text-xs text-slate-400">Pendiente RD${money(option.amountDue)} · {option.attemptsUsed}/3 intentos QR usados</span></span>
                    {option.isAuthorized && <ShieldCheck size={17} className="text-success-600" />}
                  </label>)}
                </div>}
                <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Cada cuota autorizada permite hasta 3 QRs; vencidos también cuentan.</p><button onClick={() => handleSave(assignment.id)} disabled={saving === assignment.id} className="inline-flex shrink-0 items-center gap-2 rounded-8 bg-navy-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving === assignment.id ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />} Guardar cuotas</button></div>
              </div>
            </section>;
          })}
        </div>
      </div>
    </div>
  );
}
