import { X, User, Briefcase, MapPin, CreditCard, Camera } from 'lucide-react';
import MediaViewer from '../MediaViewer';

export default function ClienteDetailModal({ client, onClose }) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{client.nombre}</h2>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Datos Personales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={16} className="text-primary-500" /> Datos Personales
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500">Cédula</p>
                <p className="font-medium text-gray-900">{client.cedula}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado Civil</p>
                <p className="font-medium text-gray-900 capitalize">{client.estadoCivil}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{client.telefono}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Nacimiento</p>
                <p className="font-medium text-gray-900">{client.fechaNacimiento ? new Date(client.fechaNacimiento).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(client.estado || '').toLowerCase() === 'activo' || client.estado === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {client.estado}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Registro</p>
                <p className="font-medium text-gray-900">{client.fechaRegistro ? new Date(client.fechaRegistro).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Info Laboral */}
          {client.workInformation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-primary-500" /> Información Laboral
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="font-medium text-gray-900">{client.workInformation.empresa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="font-medium text-gray-900">{client.workInformation.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Salario</p>
                  <p className="font-medium text-gray-900">${Number(client.workInformation.salario || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Antigüedad</p>
                  <p className="font-medium text-gray-900">{client.workInformation.antiguedadAnios} años</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Tipo de empleo</p>
                  <p className="font-medium text-gray-900 capitalize">{client.workInformation.tipoEmpleo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dirección */}
          {client.address && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary-500" /> Dirección
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">{client.address.direccion}</p>
                <p className="text-sm text-gray-600">{client.address.ciudad}, {client.address.provincia}</p>
                {client.address.sector && <p className="text-sm text-gray-600">Sector: {client.address.sector}</p>}
                {client.address.codigoPostal && <p className="text-sm text-gray-600">CP: {client.address.codigoPostal}</p>}
              </div>
            </div>
          )}

          {/* Cuenta Bancaria */}
          {client.bankAccount && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary-500" /> Cuenta Bancaria
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">{client.bankAccount.banco}</p>
                <p className="text-sm text-gray-600">Tipo: {client.bankAccount.tipoCuenta} — Cta: {client.bankAccount.numeroCuenta}</p>
              </div>
            </div>
          )}

          {/* Referencias */}
          {client.references && client.references.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Referencias</h3>
              <div className="space-y-2">
                {client.references.map((ref, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ref.nombre}</p>
                      <p className="text-sm text-gray-600">{ref.relacion} — {ref.telefono}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verificación */}
          {client.verificationMedia && (client.verificationMedia.fotoCedulaPath || client.verificationMedia.videoPath) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Camera size={16} className="text-primary-500" /> Verificación de Identidad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.verificationMedia.fotoCedulaPath && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Foto de Identificación</p>
                    <MediaViewer
                      src={`/api/media/${client.verificationMedia.fotoCedulaPath}`}
                      type="image"
                      className="h-48"
                    />
                  </div>
                )}
                {client.verificationMedia.videoPath && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Video de Verificación</p>
                    <MediaViewer
                      src={`/api/media/${client.verificationMedia.videoPath}`}
                      type="video"
                      className="h-48 bg-black"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
