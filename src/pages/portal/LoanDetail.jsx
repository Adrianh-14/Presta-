import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { prestamoService } from '../../services/prestamoService';
import { amortizationService } from '../../services/amortizationService';
import { paymentService } from '../../services/paymentService';
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
          prestamoService.getById(id),
          amortizationService.getByLoanId(id),
          paymentService.getByLoanId(id),
          paymentService.getSummary(id),
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
  const cuota = Number(loan.cuotaMensual || 0);
  const freq = loan.frecuenciaPago;
  const freqLabel = freqLabels[freq] || String(freq);
  const pp = freqPeriodsPerMonth[freq] || 1;
  const totalPagado = summary?.totalPagado ?? 0;
  const capitalPagado = summary?.totalCapital ?? 0;
  const interesPagado = summary?.totalIntereses ?? 0;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-slate-400 hover:text-navy-500 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a mis préstamos
      </button>

      <div className="gradient-hero rounded-16 p-8 text-white mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Préstamo {freqLabel}</p>
            <p className="text-4xl font-bold">${monto.toLocaleString()}</p>
          </div>
          <StatusBadge status={loan.estado} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div><p className="text-navy-200 text-xs font-medium mb-1">Cuota {freqLabel}</p><p className="text-xl font-bold">${cuota.toLocaleString()}</p><p className="text-navy-300 text-xs mt-0.5">${(cuota * pp).toLocaleString()}/mes</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Saldo pendiente</p><p className="text-xl font-bold">${saldo.toLocaleString()}</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Total pagado</p><p className="text-xl font-bold">${totalPagado.toLocaleString()}</p></div>
          <div><p className="text-navy-200 text-xs font-medium mb-1">Plazo</p><p className="text-xl font-bold">{plazo} meses</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-12 p-5 border border-surface-border shadow-card">
          <CreditCard size={16} className="text-accent-500 mb-2" />
          <p className="text-xs text-slate-400 mb-1">Capital pagado</p>
          <p className="text-xl font-bold text-navy-500">${capitalPagado.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-12 p-5 border border-surface-border shadow-card">
          <TrendingUp size={16} className="text-warning-500 mb-2" />
          <p className="text-xs text-slate-400 mb-1">Intereses pagados</p>
          <p className="text-xl font-bold text-navy-500">${interesPagado.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-12 p-5 border border-surface-border shadow-card">
          <Calendar size={16} className="text-success-500 mb-2" />
          <p className="text-xs text-slate-400 mb-1">Vencimiento</p>
          <p className="text-xl font-bold text-navy-500">{loan.fechaVencimiento ? new Date(loan.fechaVencimiento).toLocaleDateString() : '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
