import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { portalService } from '../../services/portalService';
import StatusBadge from '../../components/StatusBadge';
import { formatDateOnly } from '../../utils/dateOnly';

const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };

export default function PortalDashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalService.getMyLoans().then(setLoans).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando...</div>;

  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Portal de cliente</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Mis préstamos</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">Resumen de tus préstamos activos e historial</p>

      {loans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-16 border border-surface-border shadow-card">
          <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No tienes préstamos registrados</p>
          <p className="text-slate-400 text-sm mt-1">Solicita uno en nuestra página principal</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {loans.map((loan) => (
            <div
              key={loan.id}
              onClick={() => navigate(`/portal/prestamo/${loan.id}`)}
              className="cursor-pointer rounded-16 border border-surface-border bg-white p-6 shadow-card transition-all group hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={loan.estado} />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{freqLabels[loan.frecuenciaPago] || ''}</span>
                </div>
                <p className="text-2xl font-bold text-navy-500">${Number(loan.monto || 0).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-5">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Cuota</p>
                  <p className="text-sm font-semibold text-navy-500">${Number(loan.cuotaMensual || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Saldo pendiente</p>
                  <p className="text-sm font-semibold text-navy-500">${Number(loan.saldoPendiente || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Vencimiento</p>
                  <p className="text-sm font-semibold text-navy-500">{loan.fechaVencimiento ? formatDateOnly(loan.fechaVencimiento) : '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border flex justify-between items-center">
                <div className="flex items-center gap-5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {loan.fechaInicio ? formatDateOnly(loan.fechaInicio) : '-'}</span>
                  <span>{loan.plazo} meses</span>
                </div>
                <span className="text-accent-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver detalle <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
