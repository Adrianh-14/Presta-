import { useState } from 'react';
import { X, User, DollarSign, Briefcase, Check, XIcon } from 'lucide-react';
import StatusBadge from '../StatusBadge';

export default function SolicitudDetailModal({ solicitud, onClose, onApprove, onReject }) {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  if (!solicitud) return null;

  const tipoLabels = { personal: 'Personal', garantia: 'Garantía', 0: 'Personal', 1: 'Garantía' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <User className="text-yellow-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{solicitud.client?.nombre}</h2>
              <p className="text-sm text-gray-500">{solicitud.client?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={solicitud.estado} />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumen Préstamo */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white text-center">
            <p className="text-yellow-100 text-sm mb-1">Monto Solicitado</p>
            <p className="text-3xl font-bold mb-3">${Number(solicitud.montoSolicitado || 0).toLocaleString()}</p>
            <p className="text-yellow-200 text-sm">{tipoLabels[solicitud.tipoPrestamo] || solicitud.tipoPrestamo} — {solicitud.plazo} meses</p>
          </div>

          {/* Datos del Solicitante */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={16} className="text-primary-500" /> Datos del Solicitante
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500">Cédula</p>
                <p className="font-medium text-gray-900">{solicitud.client?.cedula || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{solicitud.client?.telefono || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Nacimiento</p>
                <p className="font-medium text-gray-900">{solicitud.client?.fechaNacimiento ? new Date(solicitud.client.fechaNacimiento).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado Civil</p>
                <p className="font-medium text-gray-900 capitalize">{solicitud.client?.estadoCivil || '-'}</p>
              </div>
            </div>
          </div>

          {/* Info Laboral */}
          {solicitud.client?.workInformation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-primary-500" /> Información Laboral
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="font-medium text-gray-900">{solicitud.client.workInformation.empresa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="font-medium text-gray-900">{solicitud.client.workInformation.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Salario</p>
                  <p className="font-medium text-gray-900">${Number(solicitud.client.workInformation.salario || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo Empleo</p>
                  <p className="font-medium text-gray-900 capitalize">{solicitud.client.workInformation.tipoEmpleo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detalles del Préstamo */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-primary-500" /> Detalles del Préstamo
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500">Tasa Mensual</p>
                <p className="font-medium text-gray-900">{solicitud.tasaInteresMensual}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gasto de Cierre</p>
                <p className="font-medium text-gray-900">{solicitud.gastoCierrePorcentaje}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cuota Estimada</p>
                <p className="font-medium text-green-600">${Number(solicitud.cuotaEstimada || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total a Pagar</p>
                <p className="font-medium text-gray-900">${Number(solicitud.totalPagar || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Intereses</p>
                <p className="font-medium text-gray-900">${Number(solicitud.totalIntereses || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Solicitud</p>
                <p className="font-medium text-gray-900">{solicitud.fechaSolicitud ? new Date(solicitud.fechaSolicitud).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {(String(solicitud.estado || '').toLowerCase() === 'pendiente' || solicitud.estado === 0) && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio del préstamo</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(solicitud.id, fechaInicio)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Check size={20} /> Aprobar Solicitud
                </button>
                <button
                  onClick={() => onReject(solicitud.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <XIcon size={20} /> Rechazar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
