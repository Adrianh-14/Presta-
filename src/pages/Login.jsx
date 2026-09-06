import { useState } from 'react';
import { authService } from '../services/authService';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => new URLSearchParams(location.search).get('reason') === 'session-expired'
    ? 'Tu sesión ya no es válida. Inicia sesión nuevamente para continuar.'
    : '');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    setResetLoading(true);
    try { await authService.requestPasswordReset(email.trim()); setResetSent(true); }
    finally { setResetLoading(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="financial-grid relative hidden min-h-screen overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute right-[-8rem] top-28 h-72 w-72 rounded-full border-[50px] border-accent-400/10" />
        <div className="relative flex items-center gap-3">
          <img src="/branding/icono-prestamos-plus.svg" alt="Préstamos Plus" className="h-10 w-10 rounded-8 object-contain" />
          <div><p className="font-display text-lg font-bold">PréstamoPlus</p><p className="text-[10px] uppercase tracking-[0.22em] text-accent-200">Control de cartera</p></div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-accent-300">Capital · Riesgo · Cobranza</p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.08] xl:text-6xl">Decisiones claras para una cartera saludable.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-200">Administra préstamos, recaudos y equipos de campo desde un registro financiero central, trazable y listo para crecer.</p>
          <div className="mt-10 grid grid-cols-3 border-y border-white/15 py-5">
            {['Cartera unificada', 'Cobro verificable', 'Acceso por roles'].map((item) => <div key={item} className="pr-5 text-xs font-semibold text-slate-200"><CheckCircle2 size={16} className="mb-2 text-success-500" />{item}</div>)}
          </div>
        </div>
        <p className="relative text-xs text-slate-400">Infraestructura financiera para operaciones responsables.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden"><img src="/branding/logo-prestamos-plus.svg" alt="Préstamos Plus" className="h-10 w-auto max-w-[190px]" /></div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Acceso empresarial</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-800">Bienvenido de vuelta</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Consulta la cartera y continúa donde dejaste tu operación.</p>

          {error && <div role="alert" className="mt-6 rounded-8 border border-red-200 bg-danger-50 px-4 py-3 text-sm text-danger-600">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-navy-700">Correo de trabajo
              <span className="relative mt-2 block"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input pl-10" placeholder="nombre@empresa.com" required /></span>
            </label>
            <label className="block text-sm font-semibold text-navy-700">Contraseña
              <span className="relative mt-2 block"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input px-10" placeholder="Tu contraseña" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>
            <button type="button" onClick={() => { setShowReset(true); setResetSent(false); }} className="-mt-2 text-left text-sm font-semibold text-accent-600 hover:text-accent-700">¿Olvidaste tu contraseña?</button>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-8 bg-navy-800 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-60">{loading ? 'Validando acceso…' : <>Entrar a mi cuenta <ArrowRight size={17} /></>}</button>
          </form>

          {showReset && <div className="mt-5 rounded-12 border border-accent-100 bg-accent-50 p-4"><p className="font-semibold text-navy-800">Recuperar contraseña</p>{resetSent ? <p className="mt-2 text-sm text-slate-600">Si el correo existe, recibirás un enlace para crear una nueva contraseña.</p> : <><p className="mt-1 text-xs text-slate-500">Te enviaremos un enlace seguro con vigencia de 30 minutos.</p><button type="button" onClick={handleReset} disabled={resetLoading} className="mt-3 rounded-8 bg-accent-600 px-3 py-2 text-sm font-bold text-white">{resetLoading ? 'Enviando…' : 'Enviar enlace'}</button></>}</div>}

          <div className="mt-7 rounded-12 border border-surface-border bg-white p-4"><div className="flex gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-success-600" /><div><p className="text-sm font-semibold text-navy-700">¿Tu empresa aún no tiene cuenta?</p><p className="mt-1 text-xs leading-5 text-slate-500">Crea el espacio de trabajo y comienza una prueba de 14 días.</p><Link to="/registro" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-accent-600 hover:text-accent-700">Registrar mi empresa <ArrowRight size={14} /></Link></div></div></div>
        </div>
      </section>
    </main>
  );
}
