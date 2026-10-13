import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, Copy, Check, CheckCircle, Download, Printer } from 'lucide-react';
import { collectorPortalService } from '../../services/cobradorService';
import { portalService } from '../../services/portalService';
import { downloadPaymentReceipt, printPaymentReceipt } from '../../utils/paymentReceipt';

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function GenerateQRModal({ isOpen, onClose, assignment }) {
  const [monto, setMonto] = useState('');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [installments, setInstallments] = useState([]);
  const [installmentNumber, setInstallmentNumber] = useState('');
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      setMonto('');
      setError('');
      setCountdown(0);
      setCopied(false);
      setInstallments([]);
      setInstallmentNumber('');
      setReceiptData(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && assignment?.id) {
      setLoadingInstallments(true);
      collectorPortalService.getQRInstallments(assignment.id)
        .then(data => {
          setInstallments(data);
          const first = data.find(item => item.canGenerate);
          setInstallmentNumber(first ? String(first.installmentNumber) : '');
          setMonto(first ? Number(first.amountDue).toFixed(2) : '');
        })
        .catch(err => setError(err.response?.data?.message || 'No hay cuotas autorizadas para QR.'))
        .finally(() => setLoadingInstallments(false));
    }
  }, [isOpen, assignment?.id]);

  useEffect(() => {
    if (qrData) {
      const updateCountdown = () => {
        const now = new Date();
        const expires = new Date(qrData.expiresAt);
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setCountdown(diff);
        if (diff <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
      updateCountdown();
      intervalRef.current = setInterval(updateCountdown, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [qrData]);

  useEffect(() => {
    if (!qrData?.token || receiptData) return undefined;
    let active = true;
    const checkPayment = async () => {
      try {
        const data = await portalService.getQRInfo(qrData.token);
        if (active && String(data.status).toLowerCase() === 'used') setReceiptData(data);
      } catch { /* QR may be unavailable while the client is scanning it. */ }
    };
    checkPayment();
    const poll = window.setInterval(checkPayment, 3000);
    return () => { active = false; window.clearInterval(poll); };
  }, [qrData, receiptData]);

  const selectedInstallment = installments.find(item => String(item.installmentNumber) === installmentNumber);

  const handleGenerate = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoading(true);
    setError('');
    if (!selectedInstallment?.canGenerate) {
      setError('Selecciona una cuota autorizada que todavía tenga intentos disponibles.');
      return;
    }
    if (parseFloat(monto) > Number(selectedInstallment.amountDue)) {
      setError('El monto no puede exceder el saldo de esta cuota.');
      return;
    }
    try {
      const result = await collectorPortalService.generateQR(assignment.id, selectedInstallment.installmentNumber, parseFloat(monto));
      setQrData(result);
      setInstallments(prev => prev.map(item => item.installmentNumber === selectedInstallment.installmentNumber ? { ...item, attemptsUsed: item.attemptsUsed + 1, attemptsRemaining: Math.max(0, item.attemptsRemaining - 1), canGenerate: item.attemptsRemaining > 1 } : item));
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || 'Error al generar QR');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = qrData ? `${window.location.origin}/portal/pago-qr?token=${qrData.token}` : '';

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cuotaRapida = Number(selectedInstallment?.amountDue || 0);

  if (!isOpen) return null;

  return (
    <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onClick={onClose}>
      <div className="bg-white rounded-16 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div>
            <h3 className="text-lg font-bold text-navy-500">Generar QR de Cobro</h3>
            <p className="text-xs text-slate-400">{assignment.clienteNombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-8 hover:bg-surface-fill transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          {!qrData ? (
            <>
              {loadingInstallments ? <div className="flex justify-center py-8"><Clock size={20} className="animate-pulse text-accent-500" /></div> : <>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-navy-500">Cuota autorizada</label>
                <select value={installmentNumber} onChange={event => { const number = event.target.value; setInstallmentNumber(number); const option = installments.find(item => String(item.installmentNumber) === number); setMonto(option ? Number(option.amountDue).toFixed(2) : ''); setError(''); }} className="w-full rounded-8 border border-surface-border bg-white px-3 py-2.5 text-sm text-navy-500">
                  <option value="">Selecciona una cuota asignada</option>
                  {installments.map(item => <option key={item.installmentNumber} value={item.installmentNumber} disabled={!item.canGenerate}>Cuota #{item.installmentNumber} · Pendiente ${formatAmount(item.amountDue)} · {item.attemptsRemaining} intento(s)</option>)}
                </select>
              </div>
              {selectedInstallment && <p className="mb-4 rounded-8 bg-surface-fill p-3 text-xs text-slate-500">Cuota #{selectedInstallment.installmentNumber}: {selectedInstallment.attemptsUsed}/3 QRs generados. Se cobra únicamente esta cuota.</p>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-500 mb-1.5">Monto a cobrar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" max={selectedInstallment?.amountDue || 0} step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
                <button type="button" onClick={() => setMonto(cuotaRapida.toFixed(2))} disabled={!selectedInstallment} className="mt-2 rounded-8 bg-surface-fill px-3 py-1 text-xs text-navy-500 hover:bg-surface-hover disabled:opacity-50">Importe restante de la cuota (${formatAmount(cuotaRapida)})</button>
              </div>

              <div className="mb-4 rounded-8 bg-surface-fill p-3"><p className="text-xs text-slate-500">Monto máximo permitido para esta cuota: <strong className="text-navy-500">${formatAmount(selectedInstallment?.amountDue)}</strong>. Este QR no liquida cuotas adicionales.</p></div>

              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

              <button onClick={handleGenerate} disabled={loading || loadingInstallments || !monto || !selectedInstallment?.canGenerate}
                className="w-full py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
                {loading ? 'Generando...' : 'Generar QR'}
              </button>
              </>}
            </>
          ) : (
            <div className="flex flex-col items-center">
              {receiptData && (
                <div className="mb-4 w-full rounded-12 border border-success-200 bg-success-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2 text-success-700"><CheckCircle size={18} /> <span className="font-bold">Pago confirmado</span></div>
                  <p className="text-xs text-success-700">El cliente confirmó el pago y el préstamo fue actualizado.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => downloadPaymentReceipt({ ...receiptData, capital: receiptData.capitalAplicado, interes: receiptData.interesAplicado, mora: receiptData.moraAplicada, fechaPago: receiptData.fechaPago, cuotasAplicadas: receiptData.cuotasAplicadas, totalCuotas: receiptData.totalCuotas })} className="flex items-center justify-center gap-1 rounded-8 bg-success-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-success-700"><Download size={13} /> PDF</button>
                    <button type="button" onClick={() => printPaymentReceipt({ ...receiptData, capital: receiptData.capitalAplicado, interes: receiptData.interesAplicado, mora: receiptData.moraAplicada, fechaPago: receiptData.fechaPago, cuotasAplicadas: receiptData.cuotasAplicadas, totalCuotas: receiptData.totalCuotas })} className="flex items-center justify-center gap-1 rounded-8 border border-success-200 bg-white px-2 py-2 text-[11px] font-bold text-success-700 hover:bg-success-100"><Printer size={13} /> Imprimir</button>
                  </div>
                </div>
              )}
              <div className={`relative p-4 bg-white rounded-12 border-2 ${countdown <= 30 ? 'border-red-300' : 'border-surface-border'} mb-4`}>
                <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin />
                {countdown <= 30 && countdown > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    Expira pronto
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className={countdown <= 30 ? 'text-red-500' : 'text-accent-500'} />
                <span className={`text-sm font-mono font-bold ${countdown <= 30 ? 'text-red-500' : 'text-navy-500'}`}>
                  {formatTime(countdown)}
                </span>
              </div>

              <p className="text-sm text-navy-500 font-semibold mb-1">{assignment.clienteNombre}</p>
              <p className="mb-1 text-xs text-slate-400">Pago asignado a cuota #{qrData.numeroCuota}</p>
              <p className="text-2xl font-bold text-accent-500 mb-4">${parseFloat(qrData.monto).toLocaleString()}</p>

              <button onClick={handleCopyLink}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-accent-500 transition-colors mb-4">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </button>

              {countdown === 0 && (
                <div className="text-center">
                  <p className="text-red-500 text-sm font-semibold mb-3">QR expirado</p>
                  <button onClick={() => { setQrData(null); setMonto(''); }}
                    className="px-4 py-2 bg-accent-500 text-white text-sm font-semibold rounded-8">
                    Generar nuevo QR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
