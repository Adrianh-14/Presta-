import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { prestamoService } from '../../services/prestamoService';
import { amortizationService } from '../../services/amortizationService';
import { paymentService } from '../../services/paymentService';
import StatusBadge from '../../components/StatusBadge';

const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };
const freqPeriodsPerMonth = { mensual: 1, quincenal: 2, semanal: 4, diaria: 30, Mensual: 1, Quincenal: 2, Semanal: 4, Diaria: 30, 0: 30, 1: 4, 2: 2, 3: 1 };
const metodoLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;
  if (!loan) return <div className="text-center py-12 text-red-500">Préstamo no encontrado.</div>;

  const monto = Number(loan.monto || 0);
  const tasa = Number(loan.tasa || 0);
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
      <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> Volver a mis préstamos
      </button>

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-200 text-sm">Préstamo {freqLabel}</p>
            <p className="text-3xl font-bold">${monto.toLocaleString()}</p>
          </div>
          <StatusBadge status={loan.estado} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-primary-200 text-xs">Cuota {freqLabel}</p><p className="text-xl font-bold">${cuota.toLocaleString()}</p><p className="text-primary-300 text-xs">${(cuota * pp).toLocaleString()}/mes</p></div>
          <div><p className="text-primary-200 text-xs">Saldo</p><p className="text-xl font-bold">${saldo.toLocaleString()}</p></div>
          <div><p className="text-primary-200 text-xs">Total Pagado</p><p className="text-xl font-bold">${totalPagado.toLocaleString()}</p></div>
          <div><p className="text-primary-200 text-xs">Plazo</p><p className="text-xl font-bold">{plazo} meses</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><CreditCard size={16} className="text-blue-600 mb-1" /><p className="text-xs text-blue-600">Capital Pagado</p><p className="text-lg font-bold">${capitalPagado.toLocaleString()}</p></div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100"><TrendingUp size={16} className="text-amber-600 mb-1" /><p className="text-xs text-amber-600">Intereses Pagados</p><p className="text-lg font-bold">${interesPagado.toLocaleString()}</p></div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100"><AlertTriangle size={16} className="text-red-600 mb-1" /><p className="text-xs text-red-600">Mora Pagada</p><p className="text-lg font-bold">${(summary?.totalMora || 0).toLocaleString()}</p></div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100"><Calendar size={16} className="text-green-600 mb-1" /><p className="text-xs text-green-600">Vencimiento</p><p className="text-lg font-bold">{loan.fechaVencimiento ? new Date(loan.fechaVencimiento).toLocaleDateString() : '-'}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tabla de Amortización</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">#</th>
                  <th className="px-3 py-2 text-left text-gray-500">Fecha</th>
                  <th className="px-3 py-2 text-right text-gray-500">Cuota</th>
                  <th className="px-3 py-2 text-right text-gray-500">Capital</th>
                  <th className="px-3 py-2 text-right text-gray-500">Interés</th>
                  <th className="px-3 py-2 text-right text-gray-500">Saldo</th>
                  <th className="px-3 py-2 text-center text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {amortization.map((row) => {
                  const isPaid = row.estado === 'Pagado';
                  const isPartial = row.estado === 'Parcial';
                  const isOverdue = !isPaid && !isPartial && (row.estado === 'Vencido' || row.fechaPago < today);
                  return (
                    <tr key={row.numero} className={`${isOverdue ? 'bg-red-50' : isPaid ? 'bg-green-50/50' : isPartial ? 'bg-yellow-50' : ''}`}>
                      <td className="px-3 py-2 font-medium">{row.numero}</td>
                      <td className="px-3 py-2">{row.fechaPago ? new Date(row.fechaPago).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2 text-right">${Number(row.cuota || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-green-600">${Number(row.capital || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-amber-600">${Number(row.interes || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium">${Number(row.saldoFinal || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPaid ? 'bg-green-100 text-green-700' : isPartial ? 'bg-yellow-100 text-yellow-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>{isPaid ? 'Pagado' : isPartial ? 'Parcial' : isOverdue ? 'Vencido' : 'Pendiente'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay pagos registrados</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Fecha</th>
                    <th className="px-3 py-2 text-right text-gray-500">Monto</th>
                    <th className="px-3 py-2 text-right text-gray-500">Capital</th>
                    <th className="px-3 py-2 text-right text-gray-500">Interés</th>
                    <th className="px-3 py-2 text-right text-gray-500">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">{p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold">${Number(p.monto || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-green-600">${Number(p.capital || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-amber-600">${Number(p.interes || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${Number(p.saldoRestante || 0).toLocaleString()}</td>
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
