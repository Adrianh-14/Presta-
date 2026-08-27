import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, Copy, Check } from 'lucide-react';
import { collectorPortalService } from '../../services/cobradorService';

export default function GenerateQRModal({ isOpen, onClose, assignment }) {
  const [monto, setMonto] = useState('');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sugerido, setSugerido] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      setMonto('');
      setError('');
      setCountdown(0);
      setCopied(false);
      setSugerido(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && assignment?.id) {
      collectorPortalService.getSuggestedAmount(assignment.id)
        .then(data => {
          setSugerido(data);
          setMonto(data.totalSugerido?.toString() || '');
        })
        .catch(() => {});
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

  const handleGenerate = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await collectorPortalService.generateQR(assignment.id, parseFloat(monto));
      setQrData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar QR');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-500 mb-1.5">Monto a cobrar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
              </div>

              <div className="bg-surface-fill rounded-8 p-3 mb-4 space-y-1">
                <p className="text-xs text-slate-400">Saldo pendiente: <span className="font-semibold text-navy-500">${(assignment.saldoPendiente || 0).toLocaleString()}</span></p>
                {sugerido && (
                  <>
                    <p className="text-xs text-slate-400">Cuota: <span className="font-semibold text-navy-500">${sugerido.cuotaMensual?.toLocaleString()}</span></p>
                    {sugerido.morasPendientes > 0 && (
                      <p className="text-xs text-red-400">Mora: <span className="font-semibold text-red-500">+${sugerido.morasPendientes.toLocaleString()}</span></p>
                    )}
                  </>
                )}
              </div>

              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

              <button onClick={handleGenerate} disabled={loading || !monto}
                className="w-full py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
                {loading ? 'Generando...' : 'Generar QR'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center">
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
