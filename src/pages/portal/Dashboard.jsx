import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, TrendingUp, CreditCard } from 'lucide-react';
import { portalService } from '../../services/portalService';
import { amortizationService } from '../../services/amortizationService';
import StatusBadge from '../../components/StatusBadge';

const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };

export default function PortalDashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalService.getMyLoans().then(setLoans).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Préstamos</h1>
      <p className="text-gray-500 mb-8">Resumen de tus préstamos activos e historial</p>

      {loans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">No tienes préstamos registrados</p>
          <p className="text-gray-400 text-sm mt-1">Solicita uno en nuestra página principal</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              onClick={() => navigate(`/portal/prestamo/${loan.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={loan.estado} />
                    <span className="text-sm text-gray-500">{freqLabels[loan.frecuenciaPago] || ''}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">${Number(loan.monto || 0).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cuota</p>
                  <p className="font-medium">${Number(loan.cuotaMensual || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Saldo</p>
                  <p className="font-medium">${Number(loan.saldoPendiente || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vencimiento</p>
                  <p className="font-medium">{loan.fechaVencimiento ? new Date(loan.fechaVencimiento).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> Inicio: {loan.fechaInicio ? new Date(loan.fechaInicio).toLocaleDateString() : '-'}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={14} /> Plazo: {loan.plazo} meses</span>
                </div>
                <span className="text-primary-600 text-sm font-medium">Ver detalle →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
