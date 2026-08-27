import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { portalService } from '../../services/portalService';

const DEFAULT_TENANT = 'prestamoplus-global';
const GENERIC_REQUEST_MESSAGE =
  'Si los datos coinciden con una cuenta activa, enviaremos un código de acceso.';

export default function PortalLogin() {
  const [searchParams] = useSearchParams();
  const presetTenant = searchParams.get('tenant') || DEFAULT_TENANT;
  const [tenant] = useState(presetTenant);
  const [cedula, setCedula] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const isCodeStep = Boolean(challengeId);
  const maskedIdentifier = useMemo(() => {
    const compact = cedula.replace(/\s/g, '');
    if (compact.length < 4) return compact;
    return `${'•'.repeat(Math.max(0, compact.length - 4))}${compact.slice(-4)}`;
  }, [cedula]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestCode = async () => {
    if (!cedula.trim()) {
      setError('Escribe tu cédula.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await portalService.requestOtp(tenant.trim(), cedula.trim());
      setChallengeId(result.challengeId);
      setMessage(result.message || GENERIC_REQUEST_MESSAGE);
      setCooldown(60);
      setCode('');
    } catch (requestError) {
      if (requestError.response?.status === 429) {
        setError('Se alcanzó el límite de solicitudes. Espera unos minutos antes de intentar otra vez.');
      } else {
        setError('No pudimos procesar la solicitud. Revisa tu conexión e inténtalo otra vez.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    await requestCode();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Escribe los seis dígitos del código.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await portalService.verifyOtp(
        challengeId,
        tenant.trim(),
        cedula.trim(),
        code);
      localStorage.setItem('clientToken', result.token);
      localStorage.setItem('clientId', result.clientId);
      localStorage.setItem('clientName', result.nombre);
      localStorage.setItem('clientEmail', result.email);
      localStorage.setItem('clientSessionExpiresAt', result.expiresAt);
      navigate('/portal');
    } catch (verificationError) {
      if (verificationError.response?.status === 429) {
        setError('Demasiados intentos. Espera unos minutos antes de continuar.');
      } else {
        setError('El código es inválido, venció o la sesión fue bloqueada.');
      }
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setChallengeId(null);
    setCode('');
    setMessage('');
    setError('');
    setCooldown(0);
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-5 flex items-center justify-center gap-3 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-2 text-navy-500">
            <span className="w-6 h-6 rounded-full bg-navy-500 text-white flex items-center justify-center">1</span>
            Identidad
          </span>
          <span className="w-12 h-px bg-surface-border" />
          <span className={`flex items-center gap-2 ${isCodeStep ? 'text-navy-500' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isCodeStep ? 'bg-navy-500 text-white' : 'bg-white border border-surface-border'
            }`}>2</span>
            Código
          </span>
        </div>

        <div className="bg-white rounded-16 shadow-card-lg border border-surface-border overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-navy-500 via-navy-400 to-accent-500" />
          <div className="p-8">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-navy-50 rounded-16 flex items-center justify-center mx-auto mb-4">
                {isCodeStep
                  ? <KeyRound className="text-navy-500" size={27} />
                  : <User className="text-navy-500" size={28} />}
              </div>
              <h1 className="text-xl font-bold text-navy-500">Portal de Cliente</h1>
              <p className="text-slate-500 text-sm mt-1">
                {isCodeStep
                  ? `Confirma el código enviado para la cédula ${maskedIdentifier}`
                  : 'Confirma tu identidad para consultar tus préstamos'}
              </p>
            </div>

            {!isCodeStep ? (
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wider">
                    Cédula o documento
                  </label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(event) => setCedula(event.target.value)}
                    className="w-full px-4 py-3 border border-surface-border rounded-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-sm"
                    placeholder="001-1234567-8"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !cedula.trim()}
                  className="w-full py-3 gradient-accent text-white rounded-4 hover:opacity-90 transition-opacity font-semibold text-sm shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Enviando…' : 'Enviar código'} <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="p-3.5 bg-navy-50 border border-navy-100 rounded-8 text-xs text-navy-500 leading-relaxed">
                  {message || GENERIC_REQUEST_MESSAGE}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wider">
                    Código de seis dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3.5 border border-surface-border rounded-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-center text-2xl font-bold tracking-[0.45em] text-navy-500"
                    autoComplete="one-time-code"
                    autoFocus
                    aria-label="Código de acceso"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 gradient-accent text-white rounded-4 hover:opacity-90 transition-opacity font-semibold text-sm shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verificando…' : 'Verificar y entrar'} <ShieldCheck size={18} />
                </button>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-500"
                  >
                    <ArrowLeft size={15} /> Cambiar datos
                  </button>
                  <button
                    type="button"
                    onClick={requestCode}
                    disabled={loading || cooldown > 0}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 disabled:text-slate-400"
                  >
                    <RefreshCw size={14} />
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p role="alert" className="mt-4 p-3 bg-red-50 border border-red-100 rounded-8 text-danger-500 text-xs leading-relaxed">
                {error}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} /> Tu cédula nunca funciona como contraseña.
        </p>
      </div>
    </div>
  );
}
