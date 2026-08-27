import { useState } from 'react';
import { X, User, DollarSign, Briefcase, MapPin, Users, CreditCard, Check, XIcon, Camera, Video, Clock, SlidersHorizontal } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import MediaViewer from '../MediaViewer';

const frecuenciaLabels = { 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual', diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };
const tipoEmpleoLabels = { 0: 'Formal', 1: 'Informal', 2: 'Independiente', 3: 'Jubilado' };
const relacionLabels = { 0: 'Familiar', 1: 'Amigo', 2: 'Compañero', 3: 'Otro' };
const tipoCuentaLabels = { 0: 'Corriente', 1: 'Ahorro', 2: 'Nómina' };

export default function SolicitudDetailModal({ solicitud, onClose, onApprove, onReject, onProcess }) {
  const [instrucciones, setInstrucciones] = useState('');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [fechaPrimerPago, setFechaPrimerPago] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [montoAprobado, setMontoAprobado] = useState(() => String(solicitud?.montoSolicitado ?? ''));
  const [tasaAprobada, setTasaAprobada] = useState(() => String(solicitud?.tasaInteresMensual ?? ''));
  const [gastoCierreAprobado, setGastoCierreAprobado] = useState(() => String(solicitud?.gastoCierrePorcentaje ?? ''));
  const [plazoAprobado, setPlazoAprobado] = useState(() => String(solicitud?.plazo ?? ''));
  const [unidadPlazoAprobada, setUnidadPlazoAprobada] = useState(() => Number(solicitud?.unidadPlazo ?? 0));
  const [frecuenciaAprobada, setFrecuenciaAprobada] = useState(() => Number(solicitud?.frecuenciaPago ?? 3));

  if (!solicitud) return null;

  const tipoLabels = { personal: 'Personal', garantia: 'Garantía', 0: 'Personal', 1: 'Garantía' };
  const wi = solicitud.workInformation;
  const addr = solicitud.address;
  const refs = solicitud.references || [];
  const bank = solicitud.bankAccount;
  const estadoRaw = String(solicitud.estado ?? '').toLowerCase();
  const isPending = solicitud.estado === 0 || estadoRaw === 'pendiente';
  const isProcessing = solicitud.estado === 1 || estadoRaw === 'procesando' || estadoRaw === 'enrevision' || estadoRaw === 'en_revision';
  const montoNumero = Number(montoAprobado) || 0;
  const tasaNumero = Number(tasaAprobada) || 0;
  const cierreNumero = Number(gastoCierreAprobado) || 0;
  const plazoNumero = Number(plazoAprobado) || 0;
  const plazoMeses = unidadPlazoAprobada === 1 ? plazoNumero * 12 : plazoNumero;
  const periodsPerMonth = { 0: 30, 1: 4, 2: 2, 3: 1 }[frecuenciaAprobada] || 1;
  const totalPeriods = plazoMeses * periodsPerMonth;
  const principalAprobado = montoNumero * (1 + cierreNumero / 100);
  const ratePerPeriod = tasaNumero / 100 / periodsPerMonth;
  const factor = ratePerPeriod > 0 && totalPeriods > 0 ? Math.pow(1 + ratePerPeriod, totalPeriods) : 0;
  const cuotaAprobada = totalPeriods <= 0 || principalAprobado <= 0
    ? 0
    : ratePerPeriod <= 0
      ? principalAprobado / totalPeriods
      : principalAprobado * (ratePerPeriod * factor) / (factor - 1);
  const totalAprobado = cuotaAprobada * totalPeriods;
  const termsAreValid = montoNumero > 0
    && tasaNumero >= 0
    && cierreNumero >= 0
    && plazoNumero > 0
    && fechaInicio
    && fechaPrimerPago
    && fechaPrimerPago >= fechaInicio;

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
              <User size={16} className="text-accent-500" /> Datos del Solicitante
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
          {wi && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-accent-500" /> Información Laboral
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="font-medium text-gray-900">{wi.empresa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="font-medium text-gray-900">{wi.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Salario Mensual</p>
                  <p className="font-medium text-gray-900">${Number(wi.salario || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo Empleo</p>
                  <p className="font-medium text-gray-900">{tipoEmpleoLabels[wi.tipoEmpleo] || wi.tipoEmpleo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Antigüedad</p>
                  <p className="font-medium text-gray-900">{wi.antiguedadAnios} años</p>
                </div>
                {wi.direccionEmpresa && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Dirección Empresa</p>
                    <p className="font-medium text-gray-900">{wi.direccionEmpresa}</p>
                  </div>
                )}
                {wi.telefonoEmpresa && (
                  <div>
                    <p className="text-xs text-gray-500">Teléfono Empresa</p>
                    <p className="font-medium text-gray-900">{wi.telefonoEmpresa}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ubicación */}
          {addr && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-accent-500" /> Ubicación
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{addr.direccion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ciudad</p>
                  <p className="font-medium text-gray-900">{addr.ciudad}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Provincia</p>
                  <p className="font-medium text-gray-900">{addr.provincia}</p>
                </div>
                {addr.sector && (
                  <div>
                    <p className="text-xs text-gray-500">Sector</p>
                    <p className="font-medium text-gray-900">{addr.sector}</p>
                  </div>
                )}
                {addr.codigoPostal && (
                  <div>
                    <p className="text-xs text-gray-500">Código Postal</p>
                    <p className="font-medium text-gray-900">{addr.codigoPostal}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referencias */}
          {refs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={16} className="text-accent-500" /> Referencias Personales
              </h3>
              <div className="space-y-3">
                {refs.map((ref, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Referencia {i + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="font-medium text-gray-900">{ref.nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relación</p>
                        <p className="font-medium text-gray-900">{relacionLabels[ref.relacion] || ref.relacion}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-900">{ref.telefono}</p>
                      </div>
                      {ref.email && (
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{ref.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos Bancarios */}
          {bank && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-accent-500" /> Datos Bancarios
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500">Banco</p>
                  <p className="font-medium text-gray-900">{bank.banco}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Cuenta</p>
                  <p className="font-medium text-gray-900">{tipoCuentaLabels[bank.tipoCuenta] || bank.tipoCuenta}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Número de Cuenta</p>
                  <p className="font-medium text-gray-900">{bank.numeroCuenta}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detalles del Préstamo */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-accent-500" /> Detalles del Préstamo
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
                <p className="text-xs text-gray-500">Frecuencia de Pago</p>
                <p className="font-medium text-gray-900">{frecuenciaLabels[solicitud.frecuenciaPago] || solicitud.frecuenciaPago}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidad de Plazo</p>
                <p className="font-medium text-gray-900">{solicitud.unidadPlazo === 1 ? 'Años' : 'Meses'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Solicitud</p>
                <p className="font-medium text-gray-900">{solicitud.fechaSolicitud ? new Date(solicitud.fechaSolicitud).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Verificación - Foto y Video */}
          {solicitud.verificationMedia && (solicitud.verificationMedia.fotoCedulaPath || solicitud.verificationMedia.videoPath) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Camera size={16} className="text-accent-500" /> Verificación de Identidad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {solicitud.verificationMedia.fotoCedulaPath && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Camera size={12} /> Foto de Cédula</p>
                    <MediaViewer
                      src={`/api/media/${solicitud.verificationMedia.fotoCedulaPath}`}
                      type="image"
                      className="h-48"
                    />
                  </div>
                )}
                {solicitud.verificationMedia.videoPath && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Video size={12} /> Video de Verificación</p>
                    <MediaViewer
                      src={`/api/media/${solicitud.verificationMedia.videoPath}`}
                      type="video"
                      className="h-48 bg-black"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          {isPending && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instrucciones para el cliente</label>
                <textarea
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
                  placeholder="Ej.: Envíanos una certificación laboral actualizada antes del viernes."
                />
                <p className="mt-1 text-xs text-gray-500">Estas instrucciones aparecerán en el correo de revisión.</p>
              </div>
              <button
                onClick={() => onProcess(solicitud.id, instrucciones.trim() || null)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
              >
                <Clock size={20} /> Marcar como procesando
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-accent-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Condiciones aprobadas</h3>
                  <p className="text-xs text-gray-500">Conserva la propuesta o prepara una contraoferta.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-accent-100 bg-accent-50/40 p-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Monto a facilitar
                  <input type="number" min="0.01" step="0.01" value={montoAprobado} onChange={(e) => setMontoAprobado(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                  <span className="mt-1 block text-xs font-normal text-gray-500">Solicitó RD$ {Number(solicitud.montoSolicitado || 0).toLocaleString('es-DO')}</span>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Tasa mensual (%)
                  <input type="number" min="0" step="0.01" value={tasaAprobada} onChange={(e) => setTasaAprobada(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Gasto de cierre (%)
                  <input type="number" min="0" step="0.01" value={gastoCierreAprobado} onChange={(e) => setGastoCierreAprobado(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Plazo
                    <input type="number" min="1" step="1" value={plazoAprobado} onChange={(e) => setPlazoAprobado(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Unidad
                    <select value={unidadPlazoAprobada} onChange={(e) => setUnidadPlazoAprobada(Number(e.target.value))} className="mt-1.5 rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500">
                      <option value={0}>Meses</option>
                      <option value={1}>Años</option>
                    </select>
                  </label>
                </div>
                <label className="text-sm font-medium text-gray-700">
                  Frecuencia de pago
                  <select value={frecuenciaAprobada} onChange={(e) => setFrecuenciaAprobada(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500">
                    <option value={0}>Diaria</option>
                    <option value={1}>Semanal</option>
                    <option value={2}>Quincenal</option>
                    <option value={3}>Mensual</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Fecha del contrato
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                </label>
                <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                  Primera fecha de pago
                  <input type="date" min={fechaInicio} value={fechaPrimerPago} onChange={(e) => setFechaPrimerPago(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
                  <span className="mt-1 block text-xs font-normal text-gray-500">Las fechas siguientes se generan desde aquí según la frecuencia.</span>
                </label>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Cuota</p>
                  <p className="mt-1 font-bold text-accent-700">RD$ {cuotaAprobada.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="border-x border-gray-200 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</p>
                  <p className="mt-1 font-bold text-gray-900">RD$ {totalAprobado.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Intereses</p>
                  <p className="mt-1 font-bold text-amber-600">RD$ {Math.max(0, totalAprobado - principalAprobado).toLocaleString('es-DO', { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {!termsAreValid && <p className="text-sm text-red-600">Completa condiciones válidas y revisa las fechas de pago.</p>}
              <div className="flex gap-3">
                <button
                  disabled={!termsAreValid}
                  onClick={() => onApprove(solicitud.id, {
                    fechaInicio,
                    fechaPrimerPago,
                    montoAprobado: montoNumero,
                    tasaInteresMensual: tasaNumero,
                    gastoCierrePorcentaje: cierreNumero,
                    plazo: plazoNumero,
                    unidadPlazo: unidadPlazoAprobada,
                    frecuenciaPago: frecuenciaAprobada,
                  })}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={20} /> Aprobar con estas condiciones
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
