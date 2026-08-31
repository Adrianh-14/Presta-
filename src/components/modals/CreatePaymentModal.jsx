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
      });
      setSuccess(true);
      setTimeout(() => {
        onPaymentCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el pago');
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pago Registrado</h3>
          <p className="text-gray-500">El pago se ha procesado exitosamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Registrar Pago</h2>
              <p className="text-sm text-gray-500">{loan?.cliente}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Resumen del préstamo */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">{moraPendiente > 0 ? 'Cuota con mora' : 'Cuota esperada'}</p>
              <p className="font-semibold text-gray-900">${formatAmount(cuota)}</p>
              {moraPendiente > 0 && <p className="mt-1 text-xs text-red-600">${formatAmount(cuotaBase)} + ${formatAmount(moraPendiente)} de mora</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo Pendiente</p>
              <p className="font-semibold text-red-600">${formatAmount(saldo)}</p>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto del Pago *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                value={monto}
                onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg font-semibold"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => handleQuickPay(cuota)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                {moraPendiente > 0 ? 'Cuota + mora' : 'Cuota'} ${formatAmount(cuota)}
              </button>
              <button type="button" onClick={() => handleQuickPay(Number(saldo) + moraPendiente)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                Saldo + mora ${formatAmount(Number(saldo) + moraPendiente)}
              </button>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago *</label>
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
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    metodo === value
                      ? 'border-accent-500 bg-navy-50 text-accent-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Referencia / N. Transacción</label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Ej: TRANS-12345"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
              rows={2}
              placeholder="Observaciones del pago..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Registrar Pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
