import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, LogOut, PlusSquare, UsersRound, Receipt, Menu, X, ShieldCheck, FolderLock, Crown, Building2, Zap, PiggyBank, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/prestamos', icon: CreditCard, label: 'Préstamos' },
  { to: '/admin/nuevo-prestamo', icon: PlusSquare, label: 'Nuevo Préstamo' },
  { to: '/admin/solicitudes', icon: FileText, label: 'Solicitudes' },
  { to: '/admin/mora', icon: AlertTriangle, label: 'Mora y cobranza' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  { to: '/admin/cobradores', icon: UsersRound, label: 'Cobradores' },
  { to: '/admin/gastos', icon: Receipt, label: 'Gastos' },
  { to: '/admin/garantias', icon: FolderLock, label: 'Documentos y garantías' },
  { to: '/admin/inversiones', icon: PiggyBank, label: 'Inversiones' },
];

const platformNavItems = [
  { to: '/plataforma', icon: LayoutDashboard, label: 'Centro de plataforma', end: true },
  { to: '/plataforma/empresas', icon: Building2, label: 'Empresas' },
  { to: '/plataforma/planes', icon: CreditCard, label: 'Planes y precios' },
  { to: '/plataforma/suscripciones', icon: Receipt, label: 'Suscripciones' },
  { to: '/plataforma/promociones', icon: Zap, label: 'Promociones' },
  { to: '/plataforma/auditoria', icon: ShieldCheck, label: 'Auditoría' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tenantName, setTenantName] = useState(user?.nombreEmpresa || '');
  const [pendingRequests, setPendingRequests] = useState(0);
  const previousPending = useRef(0);
  const isPlatformAdmin = ['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(user?.role);
  useEffect(() => { if (!user?.tenantId || isPlatformAdmin) return; api.get('/api/tenant/config').then(({ data }) => setTenantName(data.nombre || '')).catch(() => {}); }, [user?.tenantId, isPlatformAdmin]);
  useEffect(() => {
    if (!user?.tenantId || isPlatformAdmin) return undefined;
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    const notify = (count) => {
      if (count > previousPending.current && previousPending.current >= 0) {
        try { const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 880; gain.gain.value = 0.06; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.16); } catch { /* el sonido requiere interacción previa en algunos navegadores */ }
      }
      previousPending.current = count; setPendingRequests(count);
    };
    const connect = async () => {
      try {
        const response = await fetch('/api/notifications/stream', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok || !response.body) throw new Error('stream unavailable');
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
        while (!cancelled) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const chunks = buffer.split('\n\n'); buffer = chunks.pop() || ''; chunks.forEach((chunk) => { const line = chunk.split('\n').find((item) => item.startsWith('data:')); if (line) { try { notify(Number(JSON.parse(line.slice(5)).pendientes || 0)); } catch { /* evento inválido */ } } }); }
      } catch { /* fallback de sondeo abajo */ }
    };
    connect();
    const fallback = window.setInterval(() => api.get('/api/dashboard/stats').then(({ data }) => { if (!cancelled) notify(Number(data.solicitudesPendientes || 0)); }).catch(() => {}), 30000);
    return () => { cancelled = true; window.clearInterval(fallback); };
  }, [user?.tenantId, isPlatformAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-navy-900 px-4 text-white md:hidden">
        <div className="flex items-center gap-3"><BrandMark /><div><p className="font-display text-sm font-bold">PréstamoPlus</p><p className="text-[9px] uppercase tracking-[0.18em] text-accent-200">Control de cartera</p></div></div>
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir navegación" className="rounded-8 border border-white/15 p-2"><Menu size={20} /></button>
      </header>
      {open && <button type="button" aria-label="Cerrar navegación" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-navy-950/60 backdrop-blur-sm md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[82vw] max-w-72 shrink-0 flex-col border-r border-navy-700 bg-navy-900 text-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-2">
          <BrandMark />
          <div>
            <h1 className="max-w-[150px] truncate font-display text-base font-bold leading-tight text-white">{tenantName || user?.nombreEmpresa || 'PréstamoPlus'}</h1>
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent-200">{user?.role} · Operación</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar navegación" className="ml-auto rounded-8 p-2 text-slate-300 hover:bg-white/10 md:hidden"><X size={18} /></button>
        </div>
      </div>

      <div className="mx-4 mt-4 flex items-center gap-2 rounded-8 border border-success-500/20 bg-success-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-200"><ShieldCheck size={14} /> Sesión protegida</div>
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto p-4">
        {(isPlatformAdmin ? platformNavItems : navItems).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-8 px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white before:absolute before:-left-4 before:h-6 before:w-1 before:rounded-r-full before:bg-accent-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon aria-hidden="true" size={18} />
            {item.label}{item.to === '/admin/solicitudes' && pendingRequests > 0 && <span className="ml-auto min-w-5 rounded-full bg-danger-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">+{pendingRequests}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10" aria-hidden="true">
            <span className="font-semibold text-white">
              {user?.nombre?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.nombre}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-8 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-danger-500/10 hover:text-red-200"
        >
          <LogOut aria-hidden="true" size={18} />
          Cerrar Sesión
        </button>
      </div>
      </aside>
    </>
  );
}

function BrandMark() {
  return <img src="/branding/icono-prestamos-plus.svg" alt="Préstamos Plus" className="h-9 w-9 shrink-0 rounded-8 object-contain" />;
}
