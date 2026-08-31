import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle, Loader2, Shield, QrCode, Camera, LockKeyhole, TriangleAlert } from 'lucide-react';
import { portalService } from '../../services/portalService';
import jsQR from 'jsqr';

function QrCodeIcon({ large = false }) {
  return <div className={`${large ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-accent-50 flex items-center justify-center mx-auto`}><QrCode size={large ? 34 : 26} className="text-accent-500" /></div>;
}

export default function PagoQR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [applying, setApplying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanFrameRef = useRef(null);
  const lastScanRef = useRef(0);

  const stopScanner = () => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
    scanFrameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerActive(false);
  };

  const getSafeQrDestination = (rawValue) => {
    const value = rawValue?.trim();
    if (!value) throw new Error('invalid-qr');

    let scannedToken = value;
    try {
      const scannedUrl = new URL(value, window.location.origin);
      scannedToken = scannedUrl.searchParams.get('token') || '';
    } catch {
      // También aceptamos el token crudo que muestra el portal del cobrador.
    }

    if (!/^[a-f0-9]{64}$/i.test(scannedToken)) throw new Error('invalid-qr');
    return `${window.location.origin}/portal/pago-qr?token=${encodeURIComponent(scannedToken.toLowerCase())}`;
  };

  const openScannedQr = (value) => {
    try {
      const destination = getSafeQrDestination(value);
      stopScanner();
      window.location.assign(destination);
    } catch {
      setScannerError('Ese código no pertenece a un cobro válido de PréstamoPlus. Solicita al cobrador que genere uno nuevo.');
    }
  };

  const getCameraErrorMessage = (cameraError) => {
    if (!window.isSecureContext) {
      return 'La cámara requiere una conexión segura. Abre esta página con HTTPS; localhost solo funciona en el mismo dispositivo.';
    }
    if (cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError') {
      return 'El navegador bloqueó la cámara. Permítela en la configuración de este sitio y vuelve a intentarlo.';
    }
    if (cameraError?.name === 'NotFoundError' || cameraError?.name === 'OverconstrainedError') {
      return 'No se encontró una cámara compatible. Puedes pegar el enlace o token del QR debajo.';
    }
    if (cameraError?.name === 'NotReadableError' || cameraError?.name === 'AbortError') {
      return 'La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentarlo.';
    }
    return 'No pudimos iniciar la cámara. Revisa el permiso del navegador o pega el enlace del QR debajo.';
  };

  const requestCameraStream = async () => {
    const constraints = [
      { video: { facingMode: { exact: 'environment' } }, audio: false },
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: true, audio: false },
    ];
    let lastError;
    for (const constraint of constraints) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraint);
      } catch (cameraError) {
        lastError = cameraError;
        if (cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError') throw cameraError;
      }
    }
    throw lastError;
  };

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }
    // Un QR escaneado desde el teléfono debe pasar primero por el portal si
    // todavía no existe una sesión de cliente. Conservamos el token para
    // volver automáticamente a esta confirmación después del login.
    if (!localStorage.getItem('clientToken')) {
      const returnTo = `/portal/pago-qr?token=${encodeURIComponent(token)}`;
      navigate(`/portal/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }
    portalService.getQRInfo(token)
      .then(data => {
        setInfo(data);
        // El acceso al portal ya verificó la identidad mediante OTP. Al
        // regresar desde el login solo queda confirmar y aplicar el pago.
        setVerified(true);
      })
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
      if (!window.isSecureContext) throw new DOMException('Secure context required', 'SecurityError');
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('Camera API unavailable', 'NotFoundError');
      if (!videoRef.current) throw new Error('camera-view-unavailable');

      stopScanner();
      const stream = await requestCameraStream();
      streamRef.current = stream;
      let detector = null;
      if ('BarcodeDetector' in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          if (!formats || formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch {
          detector = null;
        }
      }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const scan = async (timestamp = 0) => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanFrameRef.current = requestAnimationFrame(scan);
          return;
        }
        if (timestamp - lastScanRef.current < 120) {
          scanFrameRef.current = requestAnimationFrame(scan);
          return;
        }
        lastScanRef.current = timestamp;
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
            const destination = getSafeQrDestination(value);
            stopScanner();
            window.location.assign(destination);
            return;
          }
        } catch (scanError) {
          if (scanError?.message === 'invalid-qr') {
            setScannerError('El QR detectado no corresponde a un cobro de PréstamoPlus.');
          }
        }
        scanFrameRef.current = requestAnimationFrame(scan);
      };
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScannerActive(true);
      scan();
    } catch (cameraError) {
      stopScanner();
      setScannerError(getCameraErrorMessage(cameraError));
    }
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
      localStorage.setItem('clientToken', res.clientToken);
      localStorage.setItem('clientId', res.clientId);
      localStorage.setItem('clientName', res.clienteNombre);
      localStorage.setItem('clientEmail', res.email);
      localStorage.setItem('clientSessionExpiresAt', res.expiresAt);
      setInfo(res.payment || info);
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado');
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyPayment = async () => {
    setApplying(true);
    setError('');
    try {
      const { latitud, longitud } = await getGPS();
      const payment = await portalService.processQRPayment(token, latitud, longitud);
      setResult(payment);
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos aplicar el pago. Intenta nuevamente.');
    } finally {
      setApplying(false);
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
          <div className="text-center mb-6"><QrCodeIcon /><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-600 mt-4">Pago presencial seguro</p><h2 className="text-2xl font-bold text-navy-700 mt-1">Escanear cobro</h2><p className="text-slate-500 text-sm mt-2">Apunta al QR temporal generado por tu cobrador.</p></div>
          <div className="rounded-16 border border-surface-border bg-navy-900 p-2.5 text-center mb-4 shadow-card overflow-hidden">
            <div className="relative aspect-square max-h-72 mx-auto rounded-12 overflow-hidden bg-navy-800">
              <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity ${scannerActive ? 'opacity-100' : 'opacity-0'}`} playsInline muted autoPlay />
              {!scannerActive && <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-white"><Camera size={36} className="text-accent-300" /><p className="text-sm font-semibold mt-3">Cámara trasera</p><p className="text-xs text-slate-300 mt-1">El permiso se usa solo para leer este QR.</p></div>}
              <div className="absolute inset-[14%] border-2 border-white/80 rounded-12 pointer-events-none"><span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-accent-400 rounded-tl-8" /><span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-accent-400 rounded-br-8" /></div>
            </div>
            <button type="button" onClick={scannerActive ? stopScanner : startScanner} className="mt-2.5 w-full px-4 py-3 rounded-12 bg-white text-navy-800 text-sm font-bold hover:bg-slate-50 transition-colors">{scannerActive ? 'Cerrar cámara' : 'Activar cámara'}</button>
          </div>
          {scannerError && <div role="alert" aria-live="polite" className="flex gap-2.5 rounded-12 border border-red-200 bg-danger-50 p-3 text-xs text-danger-600 mb-4"><TriangleAlert size={16} className="shrink-0" /><p>{scannerError}</p></div>}
          <input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="https://.../portal/pago-qr?token=..." className="w-full px-4 py-3 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
          <button onClick={() => openScannedQr(qrInput)} disabled={!qrInput.trim()} className="w-full mt-3 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-8 disabled:opacity-50">Validar cobro</button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><LockKeyhole size={12} /> QR válido por 5 minutos · navegación protegida</p>
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
        ) : verified ? (
          <>
            <div className="rounded-8 border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
              Identidad verificada. Revisa el monto y confirma para aplicar el pago.
            </div>
            <button onClick={handleApplyPayment} disabled={applying}
              className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {applying ? <><Loader2 size={16} className="animate-spin" /> Aplicando pago...</> : 'Aplicar pago'}
            </button>
          </>
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
