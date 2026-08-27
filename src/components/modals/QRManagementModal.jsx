import { useState, useEffect } from 'react';
import { X, QrCode, Loader2, ShieldOff } from 'lucide-react';
import { collectorPortalService } from '../../services/cobradorService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;

export default function QRManagementModal({ collector, onClose }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await collectorPortalService.getAssignments(collector.id);
        setAssignments(data);
      } catch (err) {
        console.error('Error loading assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collector.id]);

  const handleToggle = async (assignmentId, currentValue) => {
    setToggling(assignmentId);
    try {
      await collectorPortalService.toggleQRAuthorization(assignmentId, !currentValue);
      setAssignments(prev => prev.map(a =>
        a.id === assignmentId ? { ...a, isQRAuthorized: !a.isQRAuthorized } : a
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-16 shadow-card-lg max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div>
            <h2 className="text-lg font-bold text-navy-500">Autorizar Cobro QR</h2>
            <p className="text-sm text-slate-400">{collector.nombre} — {collector.zona}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-8 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="text-accent-500 animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay préstamos asignados</p>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-12 border border-surface-border hover:bg-surface-hover transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy-500">{a.clienteNombre}</p>
                    <p className="text-xs text-slate-400">{a.clienteCedula} — Saldo: {fmt(a.saldoPendiente)}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(a.id, a.isQRAuthorized)}
                    disabled={toggling === a.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-8 text-xs font-semibold transition-all ${
                      a.isQRAuthorized
                        ? 'bg-success-50 text-success-600 hover:bg-success-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {toggling === a.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : a.isQRAuthorized ? (
                      <QrCode size={12} />
                    ) : (
                      <ShieldOff size={12} />
                    )}
                    {a.isQRAuthorized ? 'QR Activo' : 'Activar QR'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-border">
          <p className="text-xs text-slate-400 text-center">
            Activa QR para que el cobrador pueda generar códigos de pago para este préstamo
          </p>
        </div>
      </div>
    </div>
  );
}
