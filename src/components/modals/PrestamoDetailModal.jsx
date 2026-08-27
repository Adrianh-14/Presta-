import { useCallback, useState, useEffect } from 'react';
import { X, DollarSign, Calendar, TrendingUp, CreditCard, AlertTriangle, Clock, ArrowUp, ArrowDown, Plus, Ban, Scale, Printer } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import CreatePaymentModal from './CreatePaymentModal';
import { paymentService } from '../../services/paymentService';
import { amortizationService } from '../../services/amortizationService';
import { printAmortization } from '../../utils/printAmortization';

export default function PrestamoDetailModal({ loan, onClose, onCancel, onMarkLegal }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [amortization, setAmortization] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const tipoLabels = { personal: 'Personal', garantia: 'Garantía', 0: 'Personal', 1: 'Garantía' };
  const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };
  const freqPeriodsPerMonth = { mensual: 1, quincenal: 2, semanal: 4, diaria: 30, Mensual: 1, Quincenal: 2, Semanal: 4, Diaria: 30, 0: 30, 1: 4, 2: 2, 3: 1 };
  const metodoLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

  const loanId = loan?.id;
  const monto = Number(loan?.monto || 0);
  const tasa = Number(loan?.tasa || 0);
  const plazo = Number(loan?.plazo || 0);
  const saldo = paymentSummary?.saldoPendiente ?? Number(loan?.saldoPendiente || 0);
  const cuotaMensual = Number(loan?.cuotaMensual || 0);
  const freq = loan?.frecuenciaPago;
  const freqLabel = freqLabels[freq] || String(freq);
  const periodsPerMonth = freqPeriodsPerMonth[freq] || 1;
  const cuotaPorPeriodo = cuotaMensual;

  const capitalPagado = paymentSummary?.totalCapital ?? (monto - saldo);
  const porcentajeCapital = monto > 0 ? ((capitalPagado / monto) * 100).toFixed(1) : 0;
  const interesPagado = paymentSummary?.totalIntereses ?? 0;
  const moraPagada = paymentSummary?.totalMora ?? 0;
  const moraPendiente = Number(paymentSummary?.moraPendiente || 0);
  const cuotaBase = Number(paymentSummary?.cuotaBase ?? cuotaPorPeriodo);
  const cuotaConMora = Number(paymentSummary?.cuotaConMora ?? cuotaBase);
  const diasMora = Number(paymentSummary?.diasMora || 0);
  const tieneMora = moraPendiente > 0;
  const totalPagado = paymentSummary?.totalPagado ?? 0;

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'amortizacion', label: 'Tabla Amortización' },
    { id: 'pagos', label: `Pagos (${payments.length})` },
  ];

  const loadPayments = useCallback(async () => {
    if (!loanId) return;
    setLoadingPayments(true);
    try {
      const [p, s] = await Promise.all([
        paymentService.getByLoanId(loanId),
        paymentService.getSummary(loanId),
      ]);
      setPayments(p);
      setPaymentSummary(s);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [loanId]);

  const loadAmortization = useCallback(async () => {
    if (!loanId) return;
    try {
      const data = await amortizationService.getByLoanId(loanId);
      setAmortization(data);
    } catch {
      setAmortization([]);
    }
  }, [loanId]);

  useEffect(() => {
    if (!loanId) return;
    loadPayments();
    if (activeTab === 'amortizacion') loadAmortization();
  }, [activeTab, loanId, loadAmortization, loadPayments]);

  if (!loan) return null;

  const onPaymentCreated = () => {
    loadPayments();
    loadAmortization();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{loan.cliente}</h2>
                <p className="text-sm text-gray-500">{tipoLabels[loan.tipo] || loan.tipo} — {freqLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={loan.estado} />
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-accent-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* TAB: Resumen */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              <div className="gradient-hero rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-navy-200 text-xs">Monto Original</p>
                    <p className="text-2xl font-bold">${monto.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs">{tieneMora ? 'Cuota con mora' : `Cuota ${freqLabel}`}</p>
                    <p className="text-2xl font-bold">${cuotaConMora.toLocaleString()}</p>
                    <p className="text-navy-300 text-xs">{tieneMora ? `Base $${cuotaBase.toLocaleString()} + mora` : `$${(cuotaBase * periodsPerMonth).toLocaleString()}/mes`}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs">Saldo Pendiente</p>
                    <p className="text-2xl font-bold">${saldo.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs">Total Pagado</p>
                    <p className="text-2xl font-bold">${totalPagado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs">Frecuencia</p>
                    <p className="text-2xl font-bold">{freqLabel}</p>
                    <p className="text-navy-300 text-xs">{periodsPerMonth} pagos/mes</p>
                  </div>
                </div>
              </div>

              {tieneMora && (
                <div className="border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-red-900">Mora pendiente generada diariamente</p>
                          <p className="text-sm text-red-700">{diasMora} {diasMora === 1 ? 'dia' : 'dias'} de atraso</p>
                        </div>
                        <p className="text-xl font-bold text-red-700">${moraPendiente.toLocaleString()}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 border-t border-red-200 pt-3 text-center">
                        <div><p className="text-xs text-red-600">Cuota base</p><p className="font-semibold text-red-900">${cuotaBase.toLocaleString()}</p></div>
                        <span className="text-red-400">+</span>
                        <div><p className="text-xs text-red-600">Mora</p><p className="font-semibold text-red-900">${moraPendiente.toLocaleString()}</p></div>
                        <span className="text-red-400">=</span>
                        <div><p className="text-xs text-red-600">Total a pagar</p><p className="font-bold text-red-900">${cuotaConMora.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progreso de Pago</span>
                  <span className="font-medium text-gray-900">{porcentajeCapital}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${Math.min(100, porcentajeCapital)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Pagado: ${capitalPagado.toLocaleString()}</span>
                  <span>Restante: ${saldo.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <CreditCard size={16} className="text-blue-600 mb-1" />
                  <p className="text-xs text-blue-600 font-medium">Capital Pagado</p>
                  <p className="text-xl font-bold text-gray-900">${capitalPagado.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <TrendingUp size={16} className="text-amber-600 mb-1" />
                  <p className="text-xs text-amber-600 font-medium">Intereses Pagados</p>
                  <p className="text-xl font-bold text-gray-900">${interesPagado.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <AlertTriangle size={16} className="text-red-600 mb-1" />
                  <p className="text-xs text-red-600 font-medium">Mora Pagada</p>
                  <p className="text-xl font-bold text-gray-900">${moraPagada.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <DollarSign size={16} className="text-green-600 mb-1" />
                  <p className="text-xs text-green-600 font-medium">Último Pago</p>
                  <p className="text-xl font-bold text-gray-900">
                    {payments.length > 0 ? `$${Number(payments[0].monto).toLocaleString()}` : '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payments.length > 0 ? new Date(payments[0].fechaPago).toLocaleDateString() : 'Sin pagos'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Desglose</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Capital Pagado</span><span className="text-green-600">${capitalPagado.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Intereses Pagados</span><span className="text-amber-600">${interesPagado.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Mora Pagada</span><span className="text-red-600">${moraPagada.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Mora Pendiente</span><span className="font-semibold text-red-600">${moraPendiente.toLocaleString()}</span></div>
                    <div className="border-t border-gray-200 pt-2"><div className="flex justify-between font-semibold"><span>Total Pagado</span><span>${totalPagado.toLocaleString()}</span></div></div>
                    <div className="flex justify-between"><span className="text-gray-600">Saldo Capital</span><span className="font-bold text-red-600">${saldo.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Información</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Tasa Anual</span><span className="font-medium">{tasa}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tasa Mensual</span><span className="font-medium">{(tasa / 12).toFixed(2)}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Plazo</span><span className="font-medium">{plazo} meses ({plazo * periodsPerMonth} pagos)</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Inicio</span><span className="font-medium">{loan.fechaInicio ? new Date(loan.fechaInicio).toLocaleDateString() : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Vencimiento</span><span className="font-medium">{loan.fechaVencimiento ? new Date(loan.fechaVencimiento).toLocaleDateString() : '-'}</span></div>
                  </div>
                </div>
              </div>

              {loan.estado !== 'pagado' && loan.estado !== 'cancelado' && loan.estado !== 3 && loan.estado !== 4 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Registrar Pago
                  </button>
                  {loan.estado !== 'legal' && loan.estado !== 5 && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Enviar este préstamo al proceso legal? Se notificará al cliente por correo.')) {
                          onMarkLegal?.(loan.id);
                        }
                      }}
                      className="py-3 px-6 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Scale size={20} /> Enviar a legal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de cancelar este préstamo? Esta acción no se puede deshacer.')) {
                        onCancel?.(loan.id);
                      }
                    }}
                    className="py-3 px-6 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Ban size={20} /> Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Tabla Amortización */}
          {activeTab === 'amortizacion' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Tabla de Amortización</h3>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">${cuotaPorPeriodo.toLocaleString()}/{freqLabel.toLowerCase()}</p>
                  <button
                    type="button"
                    disabled={amortization.length === 0}
                    onClick={() => printAmortization({
                      client: loan,
                      loan: {
                        ...loan,
                        monto,
                        tasa,
                        plazo,
                        frecuencia: freqLabel,
                        cuota: cuotaPorPeriodo,
                        totalPagar: amortization.reduce((sum, row) => sum + Number(row.cuota || 0), 0),
                      },
                      rows: amortization,
                    })}
                    className="inline-flex items-center gap-2 rounded-lg border border-accent-200 px-3 py-2 text-sm font-semibold text-accent-600 transition-colors hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Printer size={16} />
                    Imprimir / PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left font-medium text-gray-500">#</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-500">Fecha Pago</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-500">Cuota</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-500">Capital</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-500">Interés</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-500">Saldo</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(amortization.length > 0 ? amortization : []).map((row) => {
                      const isPaid = row.estado === 'Pagado';
                      const isPartial = row.estado === 'Parcial';
                      const isOverdue = !isPaid && !isPartial && (row.estado === 'Vencido' || row.fechaPago < today);
                      return (
                        <tr key={row.numero} className={`${isOverdue ? 'bg-red-50' : isPaid ? 'bg-green-50/50' : isPartial ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 py-3 font-medium text-gray-900">{row.numero}</td>
                          <td className="px-3 py-3 text-gray-700">{row.fechaPago ? new Date(row.fechaPago).toLocaleDateString() : '-'}</td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">${Number(row.cuota || 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-green-600">${Number(row.capital || 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-amber-600">${Number(row.interes || 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">${Number(row.saldoFinal || 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              isPaid ? 'bg-green-100 text-green-700' : isPartial ? 'bg-yellow-100 text-yellow-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isPaid ? 'Pagado' : isPartial ? 'Parcial' : isOverdue ? 'Vencido' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Pagos */}
          {activeTab === 'pagos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                {loan.estado !== 'pagado' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus size={16} /> Nuevo Pago
                  </button>
                )}
              </div>

              {loadingPayments ? (
                <p className="text-gray-500 text-center py-8">Cargando pagos...</p>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <DollarSign className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500">No hay pagos registrados</p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-3 text-accent-500 hover:text-accent-600 text-sm font-medium"
                  >
                    Registrar primer pago
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Monto</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Capital</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Interés</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Mora</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Saldo</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">Método</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(p.monto || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-green-600">${Number(p.capital || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-amber-600">${Number(p.interes || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-600">${Number(p.moraPagada || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(p.saldoRestante || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                              {metodoLabels[p.metodoPago] || p.metodoPago}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <CreatePaymentModal
          loan={loan}
          summary={paymentSummary}
          onClose={() => setShowPaymentModal(false)}
          onPaymentCreated={onPaymentCreated}
        />
      )}
    </div>
  );
}
