import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#e55cff] to-[#8247f5] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#ffa600] to-[#0099ff] blur-3xl" />
      </div>

      <div className="bg-white rounded-16 shadow-card-lg p-8 max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-navy-500 to-navy-600 rounded-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">P+</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-500">PréstamoPlus</h1>
          <p className="text-slate-500 text-sm mt-2">Panel de administración</p>
        </div>

        {error && (
          <div className="bg-danger-50 border border-red-200 text-danger-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-500 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-surface-border rounded-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-sm"
                placeholder="admin@prestamoplus.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-surface-border rounded-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gradient-accent text-white rounded-4 hover:opacity-90 transition-opacity font-semibold text-sm shadow-btn disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-surface-canvas rounded-lg border border-surface-border">
          <p className="text-xs text-slate-500 font-semibold mb-2">Cuentas de prueba</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p><span className="font-semibold text-navy-500">Enterprise:</span> admin@prestamoplus.com / Admin123!</p>
            <p><span className="font-semibold text-navy-500">Pro:</span> admin@bancopopular.com / Admin123!</p>
            <p><span className="font-semibold text-navy-500">Basic:</span> admin@lanacional.com / Admin123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
