import { useState } from 'react';
import { authService } from '../services/authService';
import { Capacitor } from '@capacitor/core';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [logoMotion, setLogoMotion] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => new URLSearchParams(location.search).get('reason') === 'session-expired'
    ? 'Tu sesión ya no es válida. Inicia sesión nuevamente para continuar.'
    : '');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const isNativeApp = Capacitor.isNativePlatform();

  const handleReset = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setResetError('Escribe tu correo de trabajo para continuar.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try { await authService.requestPasswordReset(normalizedEmail); setResetSent(true); }
    catch (requestError) { setResetError(requestError.response?.data?.message || 'No pudimos procesar la solicitud. Intenta nuevamente.'); }
    finally { setResetLoading(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 1) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError('Escribe un correo válido.');
        return;
      }
      setError('');
      setStep(2);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      const role = data.user?.role;
      navigate(role === 'Cobrador' ? '/cobrador' : ['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(role) ? '/plataforma' : '/admin');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos validar tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-canvas text-navy-900 md:flex md:items-stretch md:justify-center md:p-0">
      <div className="grid w-full overflow-hidden bg-surface-canvas shadow-none md:min-h-screen md:grid-cols-[minmax(0,53%)_minmax(0,47%)] md:shadow-card-lg">
        <section
          className="relative hidden overflow-hidden bg-navy-900 px-6 pb-12 pt-7 text-white md:flex md:flex-col md:justify-between md:px-[5vw] md:py-14"
          onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setLogoMotion({ x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 }); }}
          onMouseLeave={() => setLogoMotion({ x: 0, y: 0 })}
        >
          <div className="pointer-events-none absolute -inset-10 opacity-90 transition-transform duration-300" style={{ transform: `translate(${logoMotion.x * -4}px, ${logoMotion.y * -4}px)`, backgroundImage: 'radial-gradient(#ffffff26 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(440px circle at ${50 + logoMotion.x * 20}% ${40 + logoMotion.y * 20}%, #FFB54735, transparent 62%)` }} />
          <div className="relative font-display text-[28px] font-extrabold tracking-tight">Bonex<span className="text-warning-500">a</span></div>
          <div className="relative flex flex-1 items-center justify-center [perspective:900px]">
            <div className="login-logo-float cursor-pointer transition-transform duration-150" style={{ transform: `translate(${logoMotion.x * 10}px, ${logoMotion.y * 10}px) rotateY(${logoMotion.x * 5}deg) rotateX(${logoMotion.y * -5}deg)` }}>
              <svg viewBox="0 0 100 100" width="340" height="340" role="img" aria-label="Logo de Bonexa" className="overflow-visible">
                <path d="M36 18.5H56.5A15.5 15.5 0 0 1 56.5 49.5H36M36 49.5H57A15.75 15.75 0 0 1 57 81H36" fill="none" stroke="#F3F6F9" strokeWidth="9" />
                {[['#FFB547', 14, '.45s'], ['#F3F6F9', 29, '.33s'], ['#F3F6F9', 44, '.21s'], ['#F3F6F9', 59, '.09s'], ['#F3F6F9', 74, '0s']].map(([fill, y, delay]) => <rect key={y} className="login-logo-drop" style={{ animationDelay: delay }} x="20" y={y} width="20" height="11.5" rx="5.5" fill={fill} />)}
                <path className="login-logo-plus" d="M54 57.75v15M46.5 65.25h15" stroke="#FFB547" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <div className="mb-5 h-[5px] w-12 rounded-full bg-warning-500" />
            <div className="mb-3.5 text-xs font-bold tracking-[.2em] text-slate-300">SOFTWARE DE PRÉSTAMOS Y COBRANZA</div>
            <h1 className="font-display text-[clamp(38px,4.2vw,60px)] font-extrabold leading-[1.02] tracking-[-.05em]">Decisiones claras<br />para una cartera<br /><span className="text-warning-500">saludable.</span></h1>
            <div className="mt-4 text-lg text-slate-300">Préstamos, cobros y equipos en un solo lugar.</div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 pb-[72px] pt-7 text-white md:hidden" style={{ backgroundColor: '#071B2E', backgroundImage: 'radial-gradient(#ffffff26 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}>
          <div className="absolute -right-[90px] top-2 opacity-80"><img src="/branding/icono-bonexa.svg" alt="" className="h-[250px] w-[250px] opacity-25" /></div>
          <div className="relative flex items-center gap-2"><img src="/branding/icono-bonexa.svg" alt="Bonexa" className="h-9 w-9 rounded-8" /><span className="font-display text-lg font-extrabold tracking-tight">Bonex<span className="text-warning-500">a</span></span></div>
          <h1 className="relative mt-[34px] max-w-[300px] font-display text-[32px] font-extrabold leading-[1.03] tracking-[-.05em]">Decisiones claras para una cartera <span className="text-warning-500">saludable.</span></h1>
        </section>

        <section className="flex min-h-screen items-start justify-center bg-surface-canvas px-4 pb-10 pt-0 md:items-center md:px-10 md:py-10" style={{ backgroundImage: 'radial-gradient(circle at 85% 8%, #FFE7B8 0, transparent 34%), radial-gradient(#071B2E14 1.2px, transparent 1.2px)', backgroundSize: 'auto, 22px 22px' }}>
          <div className="relative z-10 -mt-11 w-full max-w-[440px] rounded-[22px] bg-white p-5 shadow-card-lg md:mt-0 md:rounded-[26px] md:p-10">
            <div className="hidden w-fit items-center gap-2 rounded-full bg-success-50 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider text-success-700 md:inline-flex"><span className="login-pulse h-1.5 w-1.5 rounded-full bg-success-700" />SESIÓN PROTEGIDA</div>
            <h2 className="mt-1 font-display text-[26px] font-extrabold leading-tight md:mt-4 md:text-[34px]">Bienvenido de vuelta</h2>
            <p className="mt-1 text-sm text-slate-600 md:text-base">{step === 1 ? 'Ingresa tu correo para continuar.' : 'Escribe tu contraseña.'}</p>
            {error && <div role="alert" className="mt-4 rounded-8 border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</div>}
            <form onSubmit={handleSubmit}>
              {step === 1 ? <label className="mt-5 block text-sm font-bold md:mt-[22px]">Correo de trabajo<input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} className="auth-input mt-1.5" placeholder="nombre@empresa.com" required /></label> : <><div className="mt-4 flex items-center justify-between rounded-12 bg-surface-canvas px-3.5 py-2.5 text-sm"><span className="truncate">{email}</span><button type="button" onClick={() => { setStep(1); setPassword(''); setError(''); }} className="ml-3 font-bold text-warning-700">Cambiar</button></div><label className="mt-4 block text-sm font-bold">Contraseña<span className="relative mt-1.5 block"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} className="auth-input pr-20" placeholder="Tu contraseña" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-[13px] font-bold text-warning-700">{showPassword ? 'Ocultar' : 'Mostrar'}</button></span></label><div className="mt-1 text-right text-[13px] font-bold text-warning-700">¿Olvidaste tu contraseña?</div></>}
              <button type="submit" disabled={loading} className="relative mt-4 w-full overflow-hidden rounded-8 bg-warning-500 px-4 py-4 text-base font-bold text-navy-900 transition hover:bg-warning-400 disabled:cursor-wait disabled:opacity-60">{loading ? 'Verificando…' : step === 1 ? 'Continuar' : 'Entrar'}{loading && <span className="absolute bottom-0 left-0 h-[3px] bg-navy-900" style={{ width: '65%' }} />}</button>
            </form>
            <div className="my-4 h-px bg-slate-200 md:my-[22px]" />
            {!isNativeApp && <p className="text-center text-sm leading-7 text-slate-600">¿Eres cliente? <Link to="/portal/login" className="font-bold text-warning-700">Portal de clientes</Link><br />¿Sin cuenta? <Link to="/registro" className="font-bold text-warning-700">Registra tu empresa</Link></p>}
          </div>
        </section>

        {showReset && <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 px-5 py-8" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(event) => { if (event.target === event.currentTarget) setShowReset(false); }}><div className="w-full max-w-md rounded-16 bg-white p-6 shadow-card-lg"><div className="flex items-start justify-between gap-4"><div><p id="reset-title" className="font-display text-xl font-extrabold text-navy-800">Recuperar contraseña</p><p className="mt-1 text-sm text-slate-500">Te enviaremos un enlace seguro con vigencia de 30 minutos.</p></div><button type="button" onClick={() => setShowReset(false)} aria-label="Cerrar recuperación" className="rounded-8 px-2 text-2xl leading-none text-slate-400">×</button></div>{resetSent ? <div className="mt-6 rounded-8 bg-success-50 p-4 text-sm text-success-700">Si el correo existe, recibirás un enlace para crear una nueva contraseña.</div> : <><label className="mt-6 block text-sm font-semibold text-navy-700">Correo de trabajo<input type="email" value={resetEmail} onChange={(event) => { setResetEmail(event.target.value); setResetError(''); }} placeholder="nombre@empresa.com" required className="auth-input mt-2" /></label>{resetError && <p role="alert" className="mt-2 text-sm text-danger-600">{resetError}</p>}<button type="button" onClick={handleReset} disabled={resetLoading} className="mt-5 w-full rounded-8 bg-warning-600 px-3 py-3 text-sm font-bold text-white">{resetLoading ? 'Enviando…' : 'Enviar enlace'}</button></>}</div></div>}
      </div>
    </main>
  );
}
