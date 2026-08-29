import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function PasswordReset() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => { e.preventDefault(); setError(''); try { const r = await authService.confirmPasswordReset(token, password); setMessage(r.message); } catch (x) { setError(x.response?.data?.message || 'El enlace no es válido o expiró.'); } };
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><form onSubmit={submit} className="w-full max-w-md rounded-16 border border-surface-border bg-white p-7 shadow-card"><h1 className="font-display text-2xl font-extrabold text-navy-800">Nueva contraseña</h1><p className="mt-2 text-sm text-slate-500">Crea una contraseña segura para recuperar tu acceso.</p>{message ? <p className="mt-5 rounded-8 bg-success-50 p-3 text-sm text-success-700">{message} <Link className="font-bold" to="/login">Iniciar sesión</Link></p> : <><input type="password" minLength="12" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 12 caracteres" className="auth-input mt-6" />{error && <p className="mt-3 text-sm text-danger-600">{error}</p>}<button className="mt-5 w-full rounded-8 bg-navy-800 px-4 py-3 font-bold text-white">Actualizar contraseña</button></>}</form></main>;
}
