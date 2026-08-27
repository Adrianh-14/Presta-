import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { portalService } from '../../services/portalService';

export default function PortalPayments() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalService.getMyLoans()
      .then(setLoans)
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-accent-500" /></div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-navy-500 mb-1">Historial de pagos</h1>
      <p className="text-slate-500 text-sm mb-8">Selecciona un préstamo para consultar sus cuotas y pagos registrados.</p>
      {loans.length === 0 ? (
        <div className="bg-white rounded-16 border border-surface-border p-10 text-center shadow-card">
          <CreditCard className="mx-auto text-slate-300 mb-3" size={42} />
          <p className="text-slate-500">No tienes préstamos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => (
            <button key={loan.id} onClick={() => navigate(`/portal/prestamo/${loan.id}`)} className="text-left bg-white rounded-12 border border-surface-border p-5 shadow-card hover:shadow-card-lg transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div><p className="text-xs uppercase tracking-wider text-slate-400">Préstamo</p><p className="text-lg font-bold text-navy-500">${Number(loan.monto || 0).toLocaleString()}</p></div>
                <ArrowRight className="text-accent-500" size={18} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">Saldo pendiente</p><p className="font-semibold text-navy-500">${Number(loan.saldoPendiente || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Cuota</p><p className="font-semibold text-navy-500">${Number(loan.cuotaMensual || 0).toLocaleString()}</p></div>
              </div>
              <p className="mt-4 pt-3 border-t border-surface-border text-xs text-slate-400 flex items-center gap-1.5"><Calendar size={13} /> Ver tabla de amortización e historial</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
