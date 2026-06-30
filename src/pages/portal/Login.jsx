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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-primary-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Cliente</h1>
          <p className="text-gray-500 mt-2">Ingresa tu cédula para ver tus préstamos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            placeholder="001-1234567-8"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !cedula.trim()}
            className="w-full mt-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Acceder'} <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
