import { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, ArrowRight } from 'lucide-react';

const metodoLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

// Keep payment shortcuts precise to the cent. The API receives a number, while
// the input keeps a dot as the decimal separator (HTML/JS numeric convention).
const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseAmount = (value) => {
  const raw = String(value ?? '').trim().replace(/\s/g, '');
  if (!raw) return NaN;
  // Accept both 1,234.56 and 1.234,56 when entered manually.
  const normalized = raw.includes(',') && raw.includes('.')
    ? (raw.lastIndexOf(',') > raw.lastIndexOf('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, ''))
    : raw.includes(',') ? raw.replace(',', '.') : raw;
  return Number(normalized);
};

export default function CreatePaymentModal({ loan, summary, onClose, onPaymentCreated }) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('transferencia');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const cuotaBase = Number(summary?.cuotaBase ?? loan?.cuotaMensual ?? 0);
  const moraPendiente = Number(summary?.moraPendiente || 0);
  const cuota = Number(summary?.cuotaConMora ?? (cuotaBase + moraPendiente));
  const saldo = summary?.saldoPendiente || loan?.saldoPendiente || 0;
  const capitalPendiente = Number(summary?.capitalPendiente ?? saldo);
  const interesesPendientes = Number(summary?.interesesPendientes || 0);
  const totalLiquidacion = Number(summary?.totalLiquidacion ?? (capitalPendiente + interesesPendientes + moraPendiente));
  const montoActual = parseAmount(monto);
  const esLiquidacion = Number.isFinite(montoActual) && Math.abs(montoActual - totalLiquidacion) < 0.005;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseAmount(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { paymentService } = await import('../../services/paymentService');
      await paymentService.create({
        loanId: loan.id,
        monto: montoNum,
        metodoPago: metodo,
        referenciaExterna: referencia || null,
        notas: notas || null,
        liquidarPrestamo: esLiquidacion,
      });
      setSuccess(true);
      setTimeout(() => {
        onPaymentCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Tu sesión de autorización para registrar pagos expiró. Cierra sesión, vuelve a iniciar sesión y registra el pago nuevamente.'
        : (err.response?.data?.message || 'Error al crear el pago'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPay = (amount) => {
    // Do not round the installment: cents are part of the amount due.
    setMonto(Number(amount || 0).toFixed(2));
  };

  if (success) {
    return (
      <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-16 border border-surface-border bg-white p-8 text-center shadow-card-lg" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
            <DollarSign className="text-success-700" size={32} />
          </div>
          <h3 className="mb-2 font-display text-xl font-extrabold text-navy-800">Pago registrado</h3>
          <p className="text-sm text-slate-500">{esLiquidacion ? 'El préstamo quedó liquidado y totalmente pagado.' : 'El pago se ha procesado exitosamente.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-16 border border-surface-border bg-white shadow-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-12 bg-warning-50">
              <DollarSign className="text-warning-700" size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy-800">Registrar pago</h2>
              <p className="text-sm text-slate-500">{loan?.cliente}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-8 p-2 transition-colors hover:bg-surface-hover">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-8 border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>
          )}

          {/* Resumen del préstamo */}
          <div className="grid grid-cols-2 gap-4 rounded-12 border border-surface-border bg-surface-fill p-4">
            <div>
              <p className="text-xs text-slate-500">{moraPendiente > 0 ? 'Cuota con mora' : 'Cuota esperada'}</p>
              <p className="font-semibold text-navy-800">${formatAmount(cuota)}</p>
              {moraPendiente > 0 && <p className="mt-1 text-xs text-danger-600">${formatAmount(cuotaBase)} + ${formatAmount(moraPendiente)} de mora</p>}
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo pendiente</p>
              <p className="font-semibold text-danger-600">${formatAmount(saldo)}</p>
            </div>
            <div className="col-span-2 border-t border-surface-border pt-3">
              <p className="text-xs font-semibold text-slate-600">Liquidación total del préstamo</p>
              <p className="text-xl font-extrabold text-navy-800">${formatAmount(totalLiquidacion)}</p>
              <p className="mt-1 text-xs text-slate-500">
                Capital ${formatAmount(capitalPendiente)} + intereses ${formatAmount(interesesPendientes)} + mora ${formatAmount(moraPendiente)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Al registrar este total, se aplicará a todos los conceptos pendientes para cerrar el préstamo.</p>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy-700">Monto del pago *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-slate-400">$</span>
              <input
                type="text"
                value={monto}
                onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="auth-input pl-8 text-lg font-semibold"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => handleQuickPay(cuota)} className="rounded-8 bg-slate-100 px-3 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-200">
                {moraPendiente > 0 ? 'Cuota + mora' : 'Cuota'} ${formatAmount(cuota)}
              </button>
              <button type="button" onClick={() => handleQuickPay(totalLiquidacion)} className="rounded-8 bg-warning-50 px-3 py-1 text-sm font-semibold text-warning-800 transition-colors hover:bg-warning-100">
                Liquidación total ${formatAmount(totalLiquidacion)}
              </button>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy-700">Método de pago *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'transferencia', label: 'Transferencia', icon: ArrowRight },
                { value: 'efectivo', label: 'Efectivo', icon: Banknote },
                { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMetodo(value)}
                  className={`flex flex-col items-center gap-1 rounded-8 border-2 p-3 transition-colors ${
                    metodo === value
                      ? 'border-warning-500 bg-warning-50 text-warning-700'
                      : 'border-surface-border text-slate-600 hover:border-warning-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy-700">Referencia / N. transacción</label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="auth-input"
              placeholder="Ej: TRANS-12345"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy-700">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="auth-input resize-none"
              rows={2}
              placeholder="Observaciones del pago..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-8 bg-warning-500 py-3 font-bold text-navy-900 transition-colors hover:bg-warning-400 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : esLiquidacion ? 'Liquidar préstamo' : 'Registrar Pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
