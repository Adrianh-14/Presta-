import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { portalService } from '../../services/portalService';

const emptyProfile = { address: { direccion: '', ciudad: '', provincia: '', sector: '', codigoPostal: '' }, workInformation: { empresa: '', cargo: '', salario: '', antiguedadAnios: 0, direccionEmpresa: '', telefonoEmpresa: '', tipoEmpleo: 0 }, references: [], bankAccount: null, videoDataUrl: null };

export default function ClientProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [identity, setIdentity] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailChallenge, setEmailChallenge] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    Promise.all([portalService.getMe(), portalService.getProfileStatus()]).then(([client, profileStatus]) => {
      setIdentity(client);
      setNewEmail(client.email || '');
      setStatus(profileStatus);
      setForm({
        address: { ...emptyProfile.address, ...(client.address || {}) },
        workInformation: { ...emptyProfile.workInformation, ...(client.workInformation || {}) },
        references: client.references || [],
        bankAccount: client.bankAccount || null,
        videoDataUrl: null,
      });
    }).catch((error) => setMessage(error.response?.data?.message || 'No se pudo cargar tu perfil.')).finally(() => setLoading(false));
  }, []);
  const setAddress = (key, value) => setForm((old) => ({ ...old, address: { ...old.address, [key]: value } }));
  const setWork = (key, value) => setForm((old) => ({ ...old, workInformation: { ...old.workInformation, [key]: value } }));
  const setBank = (key, value) => setForm((old) => ({ ...old, bankAccount: { ...(old.bankAccount || { banco: '', tipoCuenta: 0, numeroCuenta: '' }), [key]: value } }));
  const updateReference = (index, key, value) => setForm((old) => ({ ...old, references: old.references.map((ref, i) => i === index ? { ...ref, [key]: value } : ref) }));
  const selectVideo = (file) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setMessage('El video debe pesar 12 MB o menos.'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((old) => ({ ...old, videoDataUrl: reader.result }));
    reader.onerror = () => setMessage('No se pudo leer el video.');
    reader.readAsDataURL(file);
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await portalService.submitProfileUpdate({
        address: form.address,
        workInformation: { ...form.workInformation, salario: Number(form.workInformation.salario || 0), antiguedadAnios: Number(form.workInformation.antiguedadAnios || 0), tipoEmpleo: Number(form.workInformation.tipoEmpleo || 0) },
        references: form.references.map((ref) => ({ ...ref, relacion: Number(ref.relacion || 0) })),
        bankAccount: form.bankAccount?.banco && form.bankAccount?.numeroCuenta ? { ...form.bankAccount, tipoCuenta: Number(form.bankAccount.tipoCuenta || 0) } : null,
        videoDataUrl: form.videoDataUrl,
      });
      setStatus((old) => ({ ...old, required: true, pendingReview: true }));
      setMessage('Actualización enviada. Los cambios no se aplicarán hasta que la financiera los apruebe.');
    } catch (error) { setMessage(error.response?.data?.message || 'No se pudo enviar tu actualización.'); }
    finally { setSaving(false); }
  };
  const requestEmailOtp = async () => {
    setSendingEmailOtp(true); setMessage('');
    try { const result = await portalService.requestProfileEmailOtp(newEmail); setEmailChallenge(result.challengeId); setMessage(result.message); }
    catch (error) { setMessage(error.response?.data?.message || 'No se pudo enviar el código.'); }
    finally { setSendingEmailOtp(false); }
  };
  const confirmEmail = async () => {
    setSendingEmailOtp(true); setMessage('');
    try { const result = await portalService.confirmProfileEmail(emailChallenge, newEmail, emailCode); setIdentity((old) => ({ ...old, email: result.email })); setNewEmail(result.email); setEmailChallenge(''); setEmailCode(''); setMessage(result.message); }
    catch (error) { setMessage(error.response?.data?.message || 'No se pudo verificar el correo.'); }
    finally { setSendingEmailOtp(false); }
  };

  if (loading) return <div className="mx-auto max-w-3xl py-16 text-center text-slate-500" role="status">Cargando tu perfil…</div>;
  const field = (label, value, onChange, type = 'text', required = false) => <label className="block text-sm font-semibold text-navy-700">{label}<input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} className="auth-input mt-1" /></label>;
  return <div className="mx-auto max-w-4xl pb-10">
    <div className="mb-6"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-600">Tus datos</p><h1 className="mt-1 font-display text-3xl font-extrabold text-navy-800">Actualiza tu perfil</h1><p className="mt-2 text-sm text-slate-500">Mantén al día tu domicilio y la información que la financiera necesita para atenderte.</p></div>
    {status?.pendingReview && <div className="mb-5 flex gap-3 rounded-12 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><Clock3 size={19} className="mt-0.5 shrink-0"/><div><b>Tu actualización está en revisión.</b><p className="mt-1">La financiera debe aprobarla antes de aplicar los cambios. Mientras tanto puedes pagar tus cuotas.</p></div></div>}
    {status?.required && !status.pendingReview && <div className="mb-5 flex gap-3 rounded-12 border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><AlertCircle size={19} className="mt-0.5 shrink-0"/><div><b>Necesitamos que confirmes tus datos.</b><p className="mt-1">Tu financiera solicita esta revisión cada {status.refreshMonths} meses.</p></div></div>}
    {status?.status === 'Rejected' && status.reviewNote && <div className="mb-5 rounded-12 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><b>La financiera pidió corregir tu última actualización.</b><p className="mt-1">{status.reviewNote}</p></div>}
    <div className="mb-5 grid gap-3 rounded-12 border border-surface-border bg-white p-4 sm:grid-cols-3">
      <div><span className="block text-xs text-slate-400">Nombre</span><b className="text-sm text-navy-700">{identity?.nombre || 'Registrado'}</b></div>
      <div><span className="block text-xs text-slate-400">Cédula</span><b className="text-sm text-navy-700">{identity?.cedula || 'No editable'}</b></div>
      <div><span className="block text-xs text-slate-400">Fecha de nacimiento</span><b className="text-sm text-navy-700">{identity?.fechaNacimiento ? new Date(identity.fechaNacimiento).toLocaleDateString() : 'No editable'}</b></div>
      <div className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole size={15}/> Nombre, cédula y nacimiento se protegen contra cambios.</div>
    </div>
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-navy-700">Domicilio actual</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{field('Dirección', form.address.direccion, (v) => setAddress('direccion', v), 'text', true)}{field('Sector', form.address.sector, (v) => setAddress('sector', v))}{field('Ciudad', form.address.ciudad, (v) => setAddress('ciudad', v), 'text', true)}{field('Provincia', form.address.provincia, (v) => setAddress('provincia', v), 'text', true)}</div></section>
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-navy-700">Información laboral</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{field('Empresa o actividad', form.workInformation.empresa, (v) => setWork('empresa', v))}{field('Ocupación', form.workInformation.cargo, (v) => setWork('cargo', v))}{field('Ingreso mensual', form.workInformation.salario, (v) => setWork('salario', v), 'number')}{field('Antigüedad (años)', form.workInformation.antiguedadAnios, (v) => setWork('antiguedadAnios', v), 'number')}</div></section>
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-navy-700">Correo y teléfono</h2><p className="mt-1 text-xs text-slate-500">El correo se cambia solo después de verificar un código enviado a la nueva dirección. El teléfono queda bloqueado hasta contar con OTP por SMS/WhatsApp transaccional.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-navy-700">Correo actual<input readOnly value={identity?.email || ''} className="auth-input mt-1 bg-surface-canvas" /></label>{field('Nuevo correo', newEmail, setNewEmail, 'email')}</div>{!emailChallenge ? <button type="button" disabled={sendingEmailOtp || !newEmail || newEmail.toLowerCase() === identity?.email?.toLowerCase()} onClick={requestEmailOtp} className="mt-4 rounded-8 border border-accent-300 px-4 py-2 text-sm font-semibold text-accent-700 disabled:opacity-50">{sendingEmailOtp ? 'Enviando…' : 'Enviar código al nuevo correo'}</button> : <div className="mt-4 flex flex-wrap items-end gap-3"><label className="block min-w-[200px] text-sm font-semibold text-navy-700">Código de 6 dígitos<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="auth-input mt-1" /></label><button type="button" disabled={sendingEmailOtp || emailCode.length !== 6} onClick={confirmEmail} className="rounded-8 bg-accent-500 px-4 py-3 text-sm font-bold text-navy-900 disabled:opacity-50">{sendingEmailOtp ? 'Verificando…' : 'Verificar correo'}</button></div>}<p className="mt-3 text-sm text-slate-600">Teléfono registrado: <b>{identity?.telefono || '—'}</b></p></section>
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-navy-700">Garantes y referencias</h2><p className="mt-1 text-xs text-slate-500">Los cambios serán revisados por la financiera.</p></div><button type="button" disabled={form.references.length >= 5} onClick={() => setForm((old) => ({ ...old, references: [...old.references, { nombre: '', relacion: 0, telefono: '', email: '' }] }))} className="rounded-8 border border-surface-border px-3 py-2 text-sm font-semibold text-navy-600 disabled:opacity-50">Agregar</button></div><div className="mt-4 space-y-3">{form.references.map((ref, index) => <div key={index} className="grid gap-3 rounded-8 bg-surface-canvas p-3 sm:grid-cols-3">{field('Nombre', ref.nombre, (v) => updateReference(index, 'nombre', v), 'text', true)}{field('Teléfono', ref.telefono, (v) => updateReference(index, 'telefono', v), 'tel', true)}{field('Correo (opcional)', ref.email, (v) => updateReference(index, 'email', v), 'email')}<button type="button" onClick={() => setForm((old) => ({ ...old, references: old.references.filter((_, i) => i !== index) }))} className="text-left text-xs font-semibold text-red-600 sm:col-span-3">Quitar referencia</button></div>)}</div></section>
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-navy-700">Cuenta bancaria</h2><p className="mt-1 text-xs text-slate-500">El número nuevo solo sustituirá al actual si la financiera autoriza el cambio.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{field('Banco', form.bankAccount?.banco, (v) => setBank('banco', v))}{field('Número de cuenta', form.bankAccount?.numeroCuenta, (v) => setBank('numeroCuenta', v))}<label className="text-sm font-semibold text-navy-700">Tipo de cuenta<select value={form.bankAccount?.tipoCuenta ?? 0} onChange={(e) => setBank('tipoCuenta', e.target.value)} className="auth-input mt-1"><option value={0}>Corriente</option><option value={1}>Ahorro</option><option value={2}>Nómina</option></select></label></div></section>
      <section className="rounded-12 border border-surface-border bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-navy-700">Video de verificación</h2><p className="mt-1 text-xs text-slate-500">Puedes enviar uno nuevo para revisión. La evidencia anterior se conserva hasta que aprueben esta.</p><label className="mt-4 block text-sm font-semibold text-navy-700">Seleccionar video<input type="file" accept="video/mp4,video/webm" onChange={(event) => selectVideo(event.target.files?.[0])} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-8 file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:font-semibold file:text-navy-700"/></label>{form.videoDataUrl && <p className="mt-2 text-xs text-emerald-700">Video listo para enviar.</p>}</section>
      <div className="rounded-12 border border-surface-border bg-white p-4 text-sm text-slate-600"><ShieldCheck size={17} className="mr-2 inline text-emerald-600"/>Cédula, nombre y nacimiento son inmutables desde el portal. Los cambios de perfil, cuenta y video requieren revisión de la financiera.</div>
      {message && <p role="status" className="rounded-8 bg-surface-canvas p-3 text-sm text-navy-700">{message}</p>}
      <div className="flex flex-wrap gap-3"><button disabled={saving || status?.pendingReview} className="inline-flex items-center gap-2 rounded-8 bg-accent-500 px-5 py-3 font-bold text-navy-900 disabled:opacity-50"><Save size={17}/>{saving ? 'Enviando…' : 'Enviar a revisión'}</button>{!status?.pendingReview && <button type="button" onClick={() => navigate('/portal')} className="rounded-8 border border-surface-border px-5 py-3 font-semibold text-slate-600">Volver a mis préstamos</button>}</div>
    </form>
  </div>;
}
