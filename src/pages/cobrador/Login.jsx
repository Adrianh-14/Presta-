import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { authService } from '../../services/authService';

export default function CollectorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        setError('Esta cuenta no es de cobrador.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      <div className="bg-white rounded-16 shadow-card-lg max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-navy-600 rounded-12 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P+</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy-500">Portal Cobrador</h1>
            <p className="text-xs text-slate-400">Acceso para cobradores</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all" />
          </div>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-4 py-2 rounded-8">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all disabled:opacity-50">
            <LogIn size={16} /> {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
