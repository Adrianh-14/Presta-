import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import { portalService } from '../../services/portalService';

export default function PortalLogin() {
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await portalService.login(cedula.trim());
      localStorage.setItem('clientToken', result.token);
      localStorage.setItem('clientId', result.clientId);
      localStorage.setItem('clientName', result.nombre);
      localStorage.setItem('clientEmail', result.email);
      navigate('/portal');
    } catch {
      setError('Cédula no encontrada. Verifica el número.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      <div className="bg-white rounded-16 shadow-card-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy-50 rounded-16 flex items-center justify-center mx-auto mb-4">
            <User className="text-navy-500" size={28} />
          </div>
          <h1 className="text-xl font-bold text-navy-500">Portal de Cliente</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa tu cédula para ver tus préstamos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wider">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full px-4 py-3 border border-surface-border rounded-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-sm"
            placeholder="001-1234567-8"
            autoFocus
          />
          {error && <p className="text-danger-500 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !cedula.trim()}
            className="w-full mt-4 py-3 gradient-accent text-white rounded-4 hover:opacity-90 transition-opacity font-semibold text-sm shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Acceder'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
