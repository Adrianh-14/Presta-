import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, User, Briefcase, MapPin, Users } from 'lucide-react';

const steps = [
  { id: 1, title: 'Datos Personales', icon: User },
  { id: 2, title: 'Información Laboral', icon: Briefcase },
  { id: 3, title: 'Ubicación', icon: MapPin },
  { id: 4, title: 'Referencias', icon: Users },
];

export default function Solicitud() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const onSubmit = (data) => {
    console.log('Solicitud enviada:', data);
    setSubmitted(true);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-500 mb-6">
            Tu solicitud ha sido recibida exitosamente. Nos pondremos en contacto contigo por correo electrónico en un plazo de 24-48 horas.
          </p>
          <p className="text-sm text-gray-400">
            Referencia: #SP-{Date.now().toString().slice(-6)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary-600">PréstamoPlus</h1>
          <p className="text-sm text-gray-500">Solicitud de Préstamo</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className="hidden md:block font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Datos Personales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                  <input
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Juan Pérez"
                  />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RNC *</label>
                  <input
                    {...register('cedula', { required: 'La cédula es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="001-1234567-8"
                  />
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input
                    {...register('telefono', { required: 'El teléfono es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="809-555-0101"
                  />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de nacimiento *</label>
                  <input
                    {...register('fechaNacimiento', { required: 'La fecha es requerida' })}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.fechaNacimiento && <p className="text-red-500 text-sm mt-1">{errors.fechaNacimiento.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado civil *</label>
                  <select
                    {...register('estadoCivil', { required: 'El estado civil es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                  </select>
                  {errors.estadoCivil && <p className="text-red-500 text-sm mt-1">{errors.estadoCivil.message}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Laboral</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa *</label>
                  <input
                    {...register('empresa', { required: 'La empresa es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre de la empresa"
                  />
                  {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                  <input
                    {...register('cargo', { required: 'El cargo es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Tu cargo actual"
                  />
                  {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salario mensual *</label>
                  <input
                    {...register('salario', { required: 'El salario es requerido' })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="15000"
                  />
                  {errors.salario && <p className="text-red-500 text-sm mt-1">{errors.salario.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad (años) *</label>
                  <input
                    {...register('antiguedad', { required: 'La antigüedad es requerida' })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="3"
                  />
                  {errors.antiguedad && <p className="text-red-500 text-sm mt-1">{errors.antiguedad.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de la empresa</label>
                  <input
                    {...register('direccionEmpresa')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de la empresa</label>
                  <input
                    {...register('telefonoEmpresa')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="809-555-0202"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de empleo *</label>
                  <select
                    {...register('tipoEmpleo', { required: 'El tipo de empleo es requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="formal">Formal (con contrato)</option>
                    <option value="informal">Informal</option>
                    <option value="independiente">Independiente</option>
                    <option value="jubilado">Jubilado</option>
                  </select>
                  {errors.tipoEmpleo && <p className="text-red-500 text-sm mt-1">{errors.tipoEmpleo.message}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubicación</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección completa *</label>
                  <input
                    {...register('direccion', { required: 'La dirección es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Calle, número, urbanización"
                  />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                  <input
                    {...register('ciudad', { required: 'La ciudad es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Santo Domingo"
                  />
                  {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                  <select
                    {...register('provincia', { required: 'La provincia es requerida' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="DN">Distrito Nacional</option>
                    <option value="SD">Santo Domingo</option>
                    <option value="SC">Santiago</option>
                    <option value="PR">Puerto Plata</option>
                    <option value="LA">La Altagracia</option>
                  </select>
                  {errors.provincia && <p className="text-red-500 text-sm mt-1">{errors.provincia.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <input
                    {...register('sector')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Zona colonial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input
                    {...register('codigoPostal')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="10101"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Referencias Personales</h2>
              <p className="text-gray-500 mb-6">Proporciona al menos dos referencias que puedan confirmar tu identidad.</p>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 1</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input
                      {...register('ref1Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nombre de la referencia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select
                      {...register('ref1Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      {...register('ref1Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="809-555-0301"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      {...register('ref1Email')}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="referencia@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 2</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input
                      {...register('ref2Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nombre de la referencia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select
                      {...register('ref2Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      {...register('ref2Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="809-555-0302"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      {...register('ref2Email')}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="referencia@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Detalles del Préstamo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto solicitado *</label>
                    <input
                      {...register('montoSolicitado', { required: 'El monto es requerido' })}
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plazo (meses) *</label>
                    <input
                      {...register('plazoMeses', { required: 'El plazo es requerido' })}
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de préstamo *</label>
                    <select
                      {...register('tipoPrestamo', { required: 'El tipo es requerido' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="personal">Personal</option>
                      <option value="garantia">Con garantía</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Propósito del préstamo *</label>
                    <input
                      {...register('proposito', { required: 'El propósito es requerido' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ej: Educación, negocio, emergencia"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={20} />
                Enviar Solicitud
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
