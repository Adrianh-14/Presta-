import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, ChevronLeft, Eye, EyeOff, ImagePlus, LocateFixed, LockKeyhole, ShieldCheck, UserRound, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CURRENCY_CATALOG } from '../data/currencies';
import CurrencyFlag from '../components/CurrencyFlag';

const initialForm = {
  businessName: '', ownerName: '', email: '', phone: '', rnc: '', password: '', acceptTerms: false,
  initialCapital: '', initialCapitalUsd: '', initialCapitalEur: '', initialCapitalByCurrency: { DOP: '' }, enabledCurrencies: ['DOP'], companyType: '', economicActivity: '', economicActivityOther: '', country: 'DO', address: '', city: '', province: '', website: '', employeeCount: '',
  representativeIdType: 'Cédula', representativeIdNumber: '', representativeIdPhoto: '', representativePhoto: ''
};

const steps = [
  { title: 'Empresa', caption: 'Identidad y actividad' },
  { title: 'Operación', caption: 'Capital y ubicación' },
  { title: 'Representante', caption: 'Validación legal' },
  { title: 'Acceso', caption: 'Cuenta administradora' }
];

const provinces = ['Azua', 'Baoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte', 'Elías Piña', 'El Seibo', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde'];
const countries = [{ code: 'DO', name: 'República Dominicana', regionLabel: 'Provincia', provinces }, ...['AR|Argentina|Provincia', 'BO|Bolivia|Departamento', 'BR|Brasil|Estado', 'CA|Canadá|Provincia', 'CL|Chile|Región', 'CO|Colombia|Departamento', 'CR|Costa Rica|Provincia', 'EC|Ecuador|Provincia', 'ES|España|Provincia', 'GT|Guatemala|Departamento', 'HN|Honduras|Departamento', 'MX|México|Estado', 'NI|Nicaragua|Departamento', 'PA|Panamá|Provincia', 'PE|Perú|Región', 'US|Estados Unidos|Estado'].map((item) => { const [code, name, regionLabel] = item.split('|'); return { code, name, regionLabel, provinces: [] }; })];
const activities = ['Préstamos personales', 'Microcrédito y emprendimiento', 'Préstamos comerciales', 'Cooperativa de ahorro y crédito', 'Financiamiento de vehículos', 'Factoring y adelanto de facturas', 'Servicios financieros digitales'];

export default function Register() {
  const { registerTenant } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  useEffect(() => {
    const field = Object.keys(fieldErrors)[0];
    if (!field) return;
    const input = document.querySelector(`[name="${field}"]`) || document.querySelector('.field-invalid .auth-input');
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [fieldErrors]);
  const update = (field) => (event) => { setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })); setFieldErrors((current) => { const next = { ...current }; delete next[field]; return next; }); setError(''); };

  const validateStep = () => {
    const required = {
      0: [['businessName', 'Indica el nombre de la empresa.'], ['companyType', 'Selecciona el tipo de empresa.'], ['economicActivity', 'Indica la actividad económica.']],
      1: [['initialCapital', 'Indica el capital inicial disponible.'], ['country', 'Selecciona el país.'], ['address', 'Indica la dirección de la empresa.'], ['city', 'Indica la ciudad.'], ['province', 'Indica la provincia.'], ['employeeCount', 'Indica la cantidad de empleados.']],
      2: [['ownerName', 'Indica el nombre del representante.'], ['representativeIdNumber', 'Indica el número de identificación.'], ['representativeIdPhoto', 'Adjunta la identificación del representante.'], ['representativePhoto', 'Adjunta una foto del representante.']],
      3: [['email', 'Indica un correo válido.'], ['password', 'Crea una contraseña segura']]
    }[step];
    const missing = required.find(([field]) => !String(form[field] ?? '').trim());
    if (missing) { setFieldErrors({ [missing[0]]: missing[1] }); setError(missing[1]); return false; }
    if (step === 0 && form.economicActivity === 'Otra' && !form.economicActivityOther.trim()) { setFieldErrors({ economicActivityOther: 'Especifica la actividad económica.' }); setError('Especifica la actividad económica.'); return false; }
    if (step === 1 && (Number(form.initialCapital) < 0 || Number(form.initialCapitalUsd) < 0 || Number(form.initialCapitalEur) < 0)) { setFieldErrors({ initialCapital: 'El capital inicial no puede ser negativo.' }); setError('El capital inicial no puede ser negativo.'); return false; }
    if (step === 1 && (!form.enabledCurrencies.length || form.enabledCurrencies.some((currency) => !String(form.initialCapitalByCurrency?.[currency] ?? (currency === 'DOP' ? form.initialCapital : currency === 'USD' ? form.initialCapitalUsd : currency === 'EUR' ? form.initialCapitalEur : '')).trim()))) { setError('Indica el capital inicial de cada divisa habilitada.'); return false; }
    if (step === 3 && !form.acceptTerms) { setFieldErrors({ acceptTerms: 'Acepta los términos para continuar.' }); setError('Acepta los términos para continuar.'); return false; }
    setFieldErrors({});
    setError('');
    return true;
  };

  const next = () => { if (validateStep()) setStep((current) => Math.min(current + 1, steps.length - 1)); };
  const previous = () => { setError(''); setStep((current) => Math.max(current - 1, 0)); };
  const locate = () => {
    if (!navigator.geolocation) { setError('Tu navegador no permite obtener la ubicación automáticamente.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('geocode');
        const data = await response.json();
        const address = data.address || {};
        const province = provinces.find((item) => item.toLowerCase() === String(address.state || address.province || '').toLowerCase()) || '';
        setForm((current) => ({ ...current, address: [address.road, address.house_number].filter(Boolean).join(' ') || current.address, city: address.city || address.town || address.municipality || current.city, province }));
      } catch { setError('No pudimos convertir tu ubicación en una dirección. Completa los campos manualmente.'); }
    }, () => setError('Permite el acceso a la ubicación para autocompletar estos campos.'));
  };

  const readImage = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setFieldErrors({ [field]: 'Usa una imagen JPG, PNG o WEBP.' }); setError('Usa una imagen JPG, PNG o WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setFieldErrors({ [field]: 'Cada imagen debe pesar como máximo 5 MB.' }); setError('Cada imagen debe pesar como máximo 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm((current) => ({ ...current, [field]: reader.result })); setFieldErrors((current) => { const next = { ...current }; delete next[field]; return next; }); setError(''); };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      await registerTenant({ ...form, initialCapitalByCurrency: Object.fromEntries(form.enabledCurrencies.map((code) => [code, Number(form.initialCapitalByCurrency?.[code] || (code === 'DOP' ? form.initialCapital : code === 'USD' ? form.initialCapitalUsd : form.initialCapitalEur) || 0)])), economicActivity: form.economicActivity === 'Otra' ? form.economicActivityOther.trim() : form.economicActivity, initialCapital: Number(form.initialCapital || 0), initialCapitalUsd: Number(form.initialCapitalUsd || 0), initialCapitalEur: Number(form.initialCapitalEur || 0), employeeCount: Number(form.employeeCount), email: form.email.trim(), phone: form.phone.trim() || null, rnc: form.rnc.trim() || null, website: form.website.trim() || null });
      navigate('/admin', { replace: true });
    } catch (requestError) {
      const response = requestError.response;
      const apiErrors = Array.isArray(response?.data?.errors) ? response.data.errors : [];
      if (apiErrors.length) {
        const mapped = Object.fromEntries(apiErrors.map((item) => [String(item.field || '').replace(/^\w/, (letter) => letter.toLowerCase()), item.message || 'Revisa este campo.']).filter(([field]) => field));
        setFieldErrors(mapped);
        setError('Revisa los campos marcados para continuar.');
        const firstField = Object.keys(mapped)[0];
        const fieldStep = Object.entries({ businessName: 0, companyType: 0, economicActivity: 0, initialCapital: 1, country: 1, address: 1, city: 1, province: 1, employeeCount: 1, ownerName: 2, representativeIdNumber: 2, representativeIdPhoto: 2, representativePhoto: 2, email: 3, password: 3 }).find(([field]) => firstField === field)?.[1];
        if (fieldStep !== undefined) setStep(fieldStep);
      } else if (response?.status === 429) {
        setError('Has alcanzado el límite de registros desde este dispositivo. Espera unos minutos antes de volver a intentarlo; ninguna cuenta nueva fue creada por este intento.');
      } else {
        setError(response?.data?.message || 'No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.');
      }
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="financial-grid hidden min-h-screen p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <Link to="/login" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"><ArrowLeft size={16} /> Volver al acceso</Link>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-300">Alta autónoma SaaS</p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight">Construye una operación financiera con datos confiables desde el primer día.</h1>
          <div className="mt-9 space-y-5">{['Perfil legal y comercial completo', 'Capital inicial bajo tu control', 'Espacio aislado para tu empresa'].map((item, index) => <div key={item} className="flex items-center gap-4"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent-300/40 bg-accent-400/10 font-mono text-xs text-accent-200">0{index + 1}</span><p className="text-sm font-semibold text-slate-100">{item}</p></div>)}</div>
        </div>
        <p className="text-xs leading-5 text-slate-400">Tus documentos se almacenan en un espacio privado de tu empresa. La prueba inicia por 14 días sin tarjeta.</p>
      </aside>

      <section className="flex min-h-screen items-start justify-center px-5 py-8 sm:px-10 xl:px-20">
        <div className="w-full max-w-2xl">
          <Link to="/login" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy-700 lg:hidden"><ArrowLeft size={16} /> Volver</Link>
          <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Registro empresarial · 14 días</p><h2 className="mt-2 font-display text-3xl font-extrabold text-navy-800">Crea tu espacio financiero</h2></div><span className="hidden rounded-full bg-success-50 px-3 py-1.5 text-xs font-bold text-success-700 sm:inline-flex"><ShieldCheck size={14} className="mr-1.5" /> Datos protegidos</span></div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Completa el perfil en cuatro pasos. El capital disponible será exactamente el monto que declares aquí.</p>

          <div className="mt-8 grid grid-cols-4 gap-2">{steps.map((item, index) => <div key={item.title} className="min-w-0"><div className={`h-1.5 rounded-full ${index <= step ? 'bg-accent-500' : 'bg-slate-200'}`} /><p className={`mt-2 truncate text-xs font-bold ${index === step ? 'text-navy-800' : 'text-slate-400'}`}>{item.title}</p><p className="hidden truncate text-[10px] text-slate-400 sm:block">{item.caption}</p></div>)}</div>
          {error && <div role="alert" className="mt-6 rounded-8 border border-red-200 bg-danger-50 px-4 py-3 text-sm text-danger-600">{error}</div>}
          {step === 1 && <CurrencyCapitalFields form={form} update={update} setForm={setForm} fieldErrors={fieldErrors} />}
          {step === 1 && <div className="mb-5 rounded-12 border border-surface-border bg-white p-4"><Field label="País de operación" required error={fieldErrors.country}><select className="auth-input" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value, province: '' }))}><option value="">Selecciona un país</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}</select></Field><p className="mt-2 text-[11px] text-slate-400">Las provincias/estados y municipios se adaptarán al país seleccionado.</p></div>}

          <form onSubmit={submit} className="mt-7 rounded-16 border border-surface-border bg-white p-5 shadow-card sm:p-7">
            {step === 0 && <Step title="Identidad de la empresa" icon={Building2} description="Cuéntanos quién opera este espacio."><Field label="Nombre comercial o razón social" required error={fieldErrors.businessName}><input autoFocus className="auth-input" value={form.businessName} onChange={update('businessName')} maxLength={200} placeholder="Financiera Ejemplo" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Tipo de empresa" required error={fieldErrors.companyType}><select className="auth-input" value={form.companyType} onChange={update('companyType')}><option value="">Selecciona una opción</option><option>Persona física con negocio</option><option>SRL</option><option>SA</option><option>Cooperativa</option><option>Otra entidad</option></select></Field><Field label="RNC"><input inputMode="numeric" className="auth-input font-mono" value={form.rnc} onChange={update('rnc')} maxLength={20} placeholder="Opcional" /></Field></div><Field label="Actividad económica" required error={fieldErrors.economicActivity}><select className="auth-input" value={form.economicActivity} onChange={update('economicActivity')}><option value="">Selecciona una actividad</option>{activities.map((activity) => <option key={activity}>{activity}</option>)}<option value="Otra">Otra</option></select></Field>{form.economicActivity === 'Otra' && <Field label="Especifica la actividad" required><input className="auth-input" value={form.economicActivityOther || ''} onChange={update('economicActivityOther')} maxLength={160} placeholder="Describe la actividad" /></Field>}<Field label="Sitio web o página pública"><input type="url" className="auth-input" value={form.website} onChange={update('website')} placeholder="https://tuempresa.com" /></Field></Step>}
            {step === 1 && <Step title="Capital y operación" icon={BadgeCheck} description="Define los límites reales de tu cartera desde el inicio."><Field label="Capital disponible inicial (RD$)" required error={fieldErrors.initialCapital} hint="Este monto alimentará tu saldo de capital disponible; no se asigna ningún valor automático."><input autoFocus type="number" min="0" step="0.01" className="auth-input font-mono text-lg" value={form.initialCapital} onChange={update('initialCapital')} placeholder="0.00" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Cantidad de empleados" required error={fieldErrors.employeeCount}><input type="number" min="1" max="100000" className="auth-input" value={form.employeeCount} onChange={update('employeeCount')} placeholder="Ej. 5" /></Field><Field label="Teléfono de la empresa"><input type="tel" className="auth-input" value={form.phone} onChange={update('phone')} maxLength={20} placeholder="(809) 000-0000" /></Field></div><Field label="Dirección fiscal u operativa" required error={fieldErrors.address}><div className="relative"><input className="auth-input pr-28" value={form.address} onChange={update('address')} maxLength={250} placeholder="Calle, número y sector" /><button type="button" onClick={locate} className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-6 bg-accent-50 px-2.5 py-1.5 text-[11px] font-bold text-accent-700 hover:bg-accent-100"><LocateFixed size={13} /> Usar GPS</button></div></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Ciudad" required error={fieldErrors.city}><input className="auth-input" value={form.city} onChange={update('city')} placeholder="Santo Domingo" /></Field><Field label="Provincia" required error={fieldErrors.province}><select className="auth-input" value={form.province} onChange={update('province')}><option value="">Selecciona una provincia</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select></Field></div><p className="-mt-2 text-[11px] text-slate-400">Puedes usar la ubicación del dispositivo para completar dirección, ciudad y provincia automáticamente.</p></Step>}
            {step === 2 && <Step title="Representante legal" icon={UserRound} description="Necesitamos validar a la persona responsable de la cuenta."><Field label="Nombre completo del representante" required error={fieldErrors.ownerName}><input autoFocus className="auth-input" value={form.ownerName} onChange={update('ownerName')} maxLength={200} placeholder="Nombre y apellido" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Tipo de identificación" required><select className="auth-input" value={form.representativeIdType} onChange={update('representativeIdType')}><option>Cédula</option><option>Pasaporte</option><option>RNC personal</option></select></Field><Field label="Número de identificación" required error={fieldErrors.representativeIdNumber}><input className="auth-input font-mono" value={form.representativeIdNumber} onChange={update('representativeIdNumber')} maxLength={40} placeholder="000-0000000-0" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><ImageUpload label="Foto de identificación" value={form.representativeIdPhoto} onChange={readImage('representativeIdPhoto')} error={fieldErrors.representativeIdPhoto} required /><ImageUpload label="Foto del representante" value={form.representativePhoto} onChange={readImage('representativePhoto')} error={fieldErrors.representativePhoto} required /></div></Step>}
            {step === 3 && <Step title="Acceso administrador" icon={LockKeyhole} description="Estos datos te permitirán entrar al panel de tu empresa."><Field label="Correo de trabajo" required error={fieldErrors.email}><input autoFocus type="email" autoComplete="email" className="auth-input" value={form.email} onChange={update('email')} placeholder="nombre@empresa.com" /></Field><Field label="Contraseña segura" required error={fieldErrors.password}><div className="relative"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="auth-input px-10" value={form.password} onChange={update('password')} minLength={12} placeholder="12+ caracteres" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field><div className="rounded-12 border border-surface-border bg-surface-fill p-4"><p className="text-xs font-bold text-navy-700">Antes de crear tu espacio</p><div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">{['Capital inicial bajo tu control', 'Perfil legal documentado', 'Espacio aislado por empresa', '14 días sin tarjeta'].map((item) => <span key={item} className="flex items-center gap-2"><Check size={13} className="text-success-600" />{item}</span>)}</div></div><label className={`flex cursor-pointer items-start gap-3 text-xs leading-5 ${fieldErrors.acceptTerms ? 'text-danger-600' : 'text-slate-500'}`}><input type="checkbox" checked={form.acceptTerms} onChange={update('acceptTerms')} className="mt-1 h-4 w-4 rounded border-surface-border text-accent-600" /><span>Acepto los términos de servicio y la política de privacidad de PréstamoPlus.</span></label></Step>}
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-surface-border pt-5"><button type="button" onClick={previous} disabled={step === 0 || loading} className="inline-flex items-center gap-1.5 rounded-8 px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:invisible"><ChevronLeft size={17} /> Atrás</button>{step < steps.length - 1 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-8 bg-navy-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-700">Continuar <ArrowRight size={17} /></button> : <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-8 bg-accent-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-700 disabled:cursor-wait disabled:opacity-60">{loading ? 'Creando espacio…' : <>Crear mi cuenta <ArrowRight size={17} /></>}</button>}</div>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">¿Ya tienes cuenta? <Link to="/login" className="font-bold text-accent-600">Inicia sesión</Link></p>
        </div>
      </section>
    </main>
  );
}

function Step({ title, description, icon: Icon, children }) { return <div><div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-accent-50 text-accent-600"><Icon size={19} /></span><div><h3 className="font-display text-xl font-extrabold text-navy-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div></div><div className="grid gap-5">{children}</div></div>; }
function CurrencyCapitalFields({ form, update, setForm, fieldErrors }) {
  const currencies = CURRENCY_CATALOG;
  return <div className="mb-7 rounded-12 border border-accent-100 bg-accent-50/40 p-4"><p className="text-sm font-semibold text-navy-700">Divisas y capital inicial <span className="text-accent-600">*</span></p><p className="mt-1 text-[11px] text-slate-500">Selecciona las monedas que manejarás e indica el saldo disponible de cada una.</p><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{currencies.map((currency) => <label key={currency.code} className="flex cursor-pointer items-center gap-2 rounded-8 border border-surface-border bg-white px-3 py-2 text-sm"><input type="checkbox" checked={form.enabledCurrencies.includes(currency.code)} onChange={(event) => setForm((current) => ({ ...current, enabledCurrencies: event.target.checked ? [...new Set([...current.enabledCurrencies, currency.code])] : current.enabledCurrencies.filter((item) => item !== currency.code) }))} className="h-4 w-4 rounded border-surface-border text-accent-600" /><CurrencyFlag currency={currency} /><b>{currency.code}</b><span className="truncate text-[11px] text-slate-400">{currency.name}</span></label>)}</div><div className="mt-4 grid max-h-72 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{currencies.filter(({ code }) => form.enabledCurrencies.includes(code)).map((currency) => <Field key={currency.code} label={`${currency.name} · ${currency.code}`} required error={fieldErrors[currency.code]}><input type="number" min="0" step="0.01" className="auth-input font-mono" value={form.initialCapitalByCurrency?.[currency.code] ?? ''} onChange={(event) => setForm((current) => ({ ...current, initialCapitalByCurrency: { ...current.initialCapitalByCurrency, [currency.code]: event.target.value }, ...(currency.code === 'DOP' ? { initialCapital: event.target.value } : currency.code === 'USD' ? { initialCapitalUsd: event.target.value } : currency.code === 'EUR' ? { initialCapitalEur: event.target.value } : {}) }))} placeholder="0.00" /></Field>)}</div></div>;
}
function Field({ label, required, hint, error, children }) { return <label className={`block text-sm font-semibold text-navy-700 ${error ? 'field-invalid' : ''}`}>{label}{required && <span className="ml-1 text-accent-600">*</span>}{children || null}{hint && <span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-400">{hint}</span>}{error && <span className="mt-1 block text-xs font-semibold text-danger-600">{error}</span>}</label>; }
function ImageUpload({ label, value, onChange, required, error }) { return <div className={error ? 'field-invalid' : ''}><p className="mb-2 text-sm font-semibold text-navy-700">{label}{required && <span className="ml-1 text-accent-600">*</span>}</p><label className="group relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-12 border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-accent-400 hover:bg-accent-50">{value ? <img src={value} alt={label} className="absolute inset-0 h-full w-full object-cover" /> : <><Upload size={22} className="text-slate-400 transition group-hover:text-accent-500" /><span className="mt-2 text-xs font-semibold text-slate-500">Subir imagen</span><span className="mt-1 text-[10px] text-slate-400">JPG, PNG o WEBP · 5 MB</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="sr-only" />{value && <span className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 text-accent-600 shadow"><ImagePlus size={14} /></span>}</label>{error && <p className="mt-1 text-xs font-semibold text-danger-600">{error}</p>}</div>; }
