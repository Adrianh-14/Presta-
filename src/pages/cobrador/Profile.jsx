import { LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CollectorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.nombre || 'C').trim().charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/cobrador/login', { replace: true });
  };

  return (
    <section className="mx-auto w-full max-w-3xl p-4 sm:p-0">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cuenta de cobrador</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-800 sm:text-3xl">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Consulta tu cuenta y administra tu sesión.</p>
      </header>

      <div className="overflow-hidden rounded-16 border border-surface-border bg-white shadow-card">
        <div className="flex items-center gap-4 border-b border-surface-border bg-navy-50/60 p-5 sm:p-7">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-500 text-xl font-bold text-white">{initials}</div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-navy-800">{user?.nombre || 'Cobrador'}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Cobrador</p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex min-w-0 items-start gap-3">
            <Mail size={18} className="mt-0.5 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Correo electrónico</p>
              <p className="mt-1 break-all text-sm font-medium text-navy-800">{user?.email || 'No disponible'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-8 bg-success-50 p-4 text-sm text-success-700">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>Tu acceso está protegido. Al cerrar sesión, este dispositivo dejará de tener acceso a tu ruta.</p>
          </div>
          <button type="button" onClick={handleLogout} className="inline-flex w-full items-center justify-center gap-2 rounded-8 border border-danger-200 px-4 py-3 text-sm font-bold text-danger-600 transition-colors hover:bg-danger-50 sm:w-auto">
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
