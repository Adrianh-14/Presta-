import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle, Clock, Loader2, Shield, QrCode } from 'lucide-react';
import { portalService } from '../../services/portalService';
import jsQR from 'jsqr';

function QrCodeIcon({ large = false }) {
  return <div className={`${large ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-accent-50 flex items-center justify-center mx-auto`}><QrCode size={large ? 34 : 26} className="text-accent-500" /></div>;
}

export default function PagoQR() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cedula, setCedula] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanFrameRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }
    portalService.getQRInfo(token)
      .then(data => setInfo(data))
      .catch(() => setError('QR no encontrado o inválido'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => () => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const startScanner = async () => {
    setScannerError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera-unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setScannerActive(true);
      const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanFrameRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          let value;
          if (detector) {
            const codes = await detector.detect(videoRef.current);
            value = codes[0]?.rawValue;
          } else {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            value = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
          }
          if (value) {
            stream.getTracks().forEach(track => track.stop());
            window.location.assign(value);
            return;
          }
        } catch { /* continúa intentando mientras la cámara esté activa */ }
        scanFrameRef.current = requestAnimationFrame(scan);
      };
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scan();
    } catch {
      setScannerError('No se pudo acceder a una cámara disponible en este dispositivo. Comprueba que el sitio use HTTPS/localhost y que exista una cámara; también puedes pegar el enlace QR abajo.');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScannerActive(false);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleRequestOtp = async () => {
    if (!cedula.trim()) { setError('Ingresa tu cédula'); return; }
    setSendingOtp(true);
    setError('');
    try {
      const res = await portalService.requestQRPaymentOtp(token, cedula.trim());
      setChallengeId(res.challengeId);
      setOtpSent(true);
      setCountdown(res.expiresInSeconds || 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar código');
    } finally {
      setSendingOtp(false);
    }
  };

  const getGPS = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ latitud: null, longitud: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
      () => resolve({ latitud: null, longitud: null }),
      { timeout: 5000, enableHighAccuracy: true }
    );
  });

  const handleVerifyAndPay = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    setVerifying(true);
    setError('');
    try {
      const { latitud, longitud } = await getGPS();
      const res = await portalService.verifyQRPaymentOtp(token, cedula.trim(), challengeId, otpCode.trim(), latitud, longitud);
      setInfo(null);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado');
    } finally {
      setVerifying(false);
    }
  };

  const [result, setResult] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 size={32} className="text-accent-500 animate-spin" />
      </div>
    );
  }

  if (!token && !info) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="bg-white rounded-16 shadow-2xl p-5 sm:p-8 max-w-md w-full">
          <div className="text-center mb-6"><QrCodeIcon /><h2 className="text-lg font-bold text-navy-500 mt-3">Pagar con QR</h2><p className="text-slate-400 text-sm mt-1">Escanea el QR que te muestra el cobrador o pega aquí su enlace.</p></div>
          <div className="rounded-12 border-2 border-dashed border-surface-border p-3 sm:p-5 text-center mb-4">
            {scannerActive ? <video ref={videoRef} className="w-full aspect-square max-h-72 object-cover rounded-8 bg-black" playsInline muted /> : <><QrCodeIcon large /><p className="text-xs text-slate-400 mt-2">Apunta la cámara al QR generado por el cobrador.</p></>}
            <button type="button" onClick={scannerActive ? stopScanner : startScanner} className="mt-3 px-4 py-2 rounded-8 bg-navy-500 text-white text-sm font-semibold">{scannerActive ? 'Cerrar cámara' : 'Activar cámara'}</button>
          </div>
          {scannerError && <p className="text-xs text-danger-500 mb-3 text-center">{scannerError}</p>}
          <input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="https://.../portal/pago-qr?token=..." className="w-full px-4 py-3 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
          <button onClick={() => { const value = qrInput.trim(); if (value) window.location.assign(value.includes('token=') ? value : `${window.location.origin}/portal/pago-qr?token=${encodeURIComponent(value)}`); }} disabled={!qrInput.trim()} className="w-full mt-3 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-8 disabled:opacity-50">Abrir QR</button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="bg-white rounded-16 shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-navy-500 mb-1">Pago Procesado</h2>
          <p className="text-slate-400 text-sm mb-4">{result.message}</p>
          <div className="bg-surface-fill rounded-8 p-4 mb-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cliente</span>
              <span className="font-semibold text-navy-500">{result.clienteNombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Monto pagado</span>
              <span className="font-bold text-accent-500">${(result.monto || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Saldo restante</span>
              <span className="font-semibold text-navy-500">${(result.saldoRestante || 0).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-2">
            <MapPin size={10} /> Ubicación GPS registrada
          </p>
          <p className="text-xs text-slate-400">Se enviará un comprobante por correo electrónico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="bg-white rounded-16 shadow-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-3">
            <MapPin size={24} className="text-accent-500" />
          </div>
          <h2 className="text-lg font-bold text-navy-500">Confirmar Pago</h2>
          <p className="text-slate-400 text-xs">Escaneaste un código QR de cobro</p>
        </div>

        {info && (
          <div className="bg-surface-fill rounded-8 p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cliente</span>
              <span className="font-semibold text-navy-500">{info.clienteNombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cobrador</span>
              <span className="text-navy-500">{info.collectorNombre}</span>
            </div>
            <div className="border-t border-surface-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Monto a pagar</span>
                <span className="text-xl font-bold text-accent-500">${(info.monto || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Saldo pendiente</span>
              <span className="text-navy-500">${(info.saldoPendiente || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {info && info.status !== 'Pending' ? (
          <p className="text-sm text-slate-400 text-center">{info.estadoMensaje}</p>
        ) : !otpSent ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Tu cédula</label>
              <input type="text" value={cedula} onChange={e => setCedula(e.target.value)}
                placeholder="Ingresa tu cédula"
                className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
            </div>
            <button onClick={handleRequestOtp} disabled={sendingOtp || !cedula.trim()}
              className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sendingOtp ? <><Loader2 size={16} className="animate-spin" /> Enviando código...</> : <><Shield size={16} /> Enviar código de verificación</>}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-green-50 text-green-600 rounded-8 p-3 mb-4 text-xs">
              <CheckCircle size={14} />
              <span>Código enviado a tu correo</span>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Código de 6 dígitos</label>
              <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6}
                className="w-full px-4 py-3 bg-surface-fill rounded-8 text-center text-2xl font-mono tracking-[0.5em] border border-surface-border focus:border-accent-500 outline-none" />
            </div>
            {countdown > 0 && (
              <p className="text-xs text-slate-400 text-center mb-3">
                Expira en {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
            )}
            <button onClick={handleVerifyAndPay} disabled={verifying || otpCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {verifying ? <><Loader2 size={16} className="animate-spin" /> Verificando...</> : 'Confirmar Pago'}
            </button>
            <button onClick={() => { setOtpSent(false); setOtpCode(''); setChallengeId(null); setCountdown(0); setError(''); }}
              className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-accent-500 transition-colors">
              Cambiar cédula
            </button>
          </>
        )}

        {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
      </div>
    </div>
  );
}
