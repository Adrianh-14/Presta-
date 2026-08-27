import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { portalService } from '../../services/portalService';
import StatusBadge from '../../components/StatusBadge';

const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };
const freqPeriodsPerMonth = { mensual: 1, quincenal: 2, semanal: 4, diaria: 30, Mensual: 1, Quincenal: 2, Semanal: 4, Diaria: 30, 0: 30, 1: 4, 2: 2, 3: 1 };

export default function PortalLoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [amortization, setAmortization] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [l, a, p, s] = await Promise.all([
          portalService.getLoan(id),
          portalService.getAmortization(id),
          portalService.getPayments(id),
          portalService.getPaymentSummary(id),
        ]);
        setLoan(l);
        setAmortization(a);
        setPayments(p);
        setSummary(s);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando...</div>;
  if (!loan) return <div className="text-center py-12 text-danger-500">Préstamo no encontrado.</div>;

  const monto = Number(loan.monto || 0);
  const plazo = Number(loan.plazo || 0);
  const saldo = summary?.saldoPendiente ?? Number(loan.saldoPendiente || 0);
  const cuotaBase = Number(summary?.cuotaBase ?? loan.cuotaMensual ?? 0);
  const moraPendiente = Number(summary?.moraPendiente || 0);
  const cuota = Number(summary?.cuotaConMora ?? (cuotaBase + moraPendiente));
  const diasMora = Number(summary?.diasMora || 0);
  const freq = loan.frecuenciaPago;
  const freqLabel = freqLabels[freq] || String(freq);
  const pp = freqPeriodsPerMonth[freq] || 1;
  const totalPagado = summary?.totalPagado ?? 0;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-slate-400 hover:text-navy-500 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a mis préstamos
      </button>

      <div className="gradient-hero rounded-16 p-5 sm:p-8 text-white mb-6 sm:mb-8">
        <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
          <div>
            <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Préstamo {freqLabel}</p>
            <p className="text-3xl sm:text-4xl font-bold">${monto.toLocaleString()}</p>
          </div>
          <StatusBadge status={loan.estado} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div><p className="text-navy-200 text-xs font-medium mb-1">{moraPendiente > 0 ? 'Cuota con mora' : `Cuota ${freqLabel}`}</p><p className="text-xl font-bold">${cuota.toLocaleString()}</p><p className="text-navy-300 text-xs mt-0.5">{moraPendiente > 0 ? `Base $${cuotaBase.toLocaleString()} + mora` : `$${(cuotaBase * pp).toLocaleString()}/mes`}</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Saldo pendiente</p><p className="text-xl font-bold">${saldo.toLocaleString()}</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Total pagado</p><p className="text-xl font-bold">${totalPagado.toLocaleString()}</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Plazo</p><p className="text-xl font-bold">{plazo} meses</p></div>
        </div>
      </div>

      {moraPendiente > 0 && (
        <div className="mb-8 border border-red-200 bg-danger-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-danger-600" size={20} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold text-red-700">Mora pendiente</p><p className="text-sm text-danger-600">Se genera diariamente. {diasMora} {diasMora === 1 ? 'dia' : 'dias'} de atraso.</p></div>
                <p className="text-xl font-bold text-red-700">${moraPendiente.toLocaleString()}</p>
              </div>
              <p className="mt-3 border-t border-red-200 pt-3 text-sm text-red-700">
                Para poner esta cuota al dia debe pagar <strong>${cuota.toLocaleString()}</strong>: ${cuotaBase.toLocaleString()} de cuota + ${moraPendiente.toLocaleString()} de mora.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
        <div className="bg-white rounded-12 border border-surface-border shadow-card p-6">
          <h3 className="text-base font-bold text-navy-500 mb-4">Tabla de Amortización</h3>
          <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-canvas">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuota</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Interés</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {amortization.map((row) => {
                  const isPaid = row.estado === 'Pagado';
                  const isPartial = row.estado === 'Parcial';
                  const isOverdue = !isPaid && !isPartial && (row.estado === 'Vencido' || row.fechaPago < today);
                  return (
                    <tr key={row.numero} className={`${isOverdue ? 'bg-danger-50/50' : isPaid ? 'bg-success-50/30' : isPartial ? 'bg-warning-50/30' : ''}`}>
                      <td className="px-3 py-2.5 text-xs font-medium text-navy-500">{row.numero}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{row.fechaPago ? new Date(row.fechaPago).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-medium">${Number(row.cuota || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-success-600">${Number(row.capital || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-warning-600">${Number(row.interes || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold">${Number(row.saldoFinal || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isPaid ? 'bg-success-50 text-success-700' : isPartial ? 'bg-warning-50 text-warning-700' : isOverdue ? 'bg-danger-50 text-danger-700' : 'bg-surface-fill text-slate-400'
                        }`}>{isPaid ? 'Pagado' : isPartial ? 'Parcial' : isOverdue ? 'Vencido' : 'Pendiente'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-12 border border-surface-border shadow-card p-6">
          <h3 className="text-base font-bold text-navy-500 mb-4">Historial de Pagos</h3>
          {payments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No hay pagos registrados</p>
          ) : (
            <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-canvas">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Interés</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold text-navy-500">${Number(p.monto || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-success-600">${Number(p.capital || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-warning-600">${Number(p.interes || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-500">${Number(p.saldoRestante || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
