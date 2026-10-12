import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';

export default function CollectorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.user?.role === 'Cobrador') {
        navigate('/cobrador');
      } else {
        // Evita dejar una sesión administrativa activa dentro del portal del
        // cobrador cuando se usó una cuenta con otro rol.
        authService.logout();
        setError('Esta cuenta no es de cobrador.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="financial-grid min-h-screen px-4 py-8 sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-16 border border-white/15 bg-white p-6 shadow-card-lg sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/branding/icono-bonexa.svg" alt="Bonexa" className="h-11 w-11 rounded-12" />
          <div><p className="font-display text-lg font-extrabold text-navy-800">Bonexa</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-600">Acceso de cobranza</p></div>
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Portal cobrador</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-800">Organiza tu ruta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Consulta tus asignaciones y registra cada visita desde el celular.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="auth-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña</label>
            <div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="auth-input pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          </div>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-4 py-2 rounded-8">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 gradient-accent text-navy-900 text-sm font-extrabold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
            {loading ? 'Ingresando...' : 'Entrar a mi ruta'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><ShieldCheck size={14} /> Sesión protegida y trazable.</p>
      </div>
    </div>
  );
}
