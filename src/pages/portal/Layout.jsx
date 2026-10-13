import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, DollarSign, LogOut, User, QrCode, MapPin, Archive, UserRound } from 'lucide-react';

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const name = localStorage.getItem('clientName') || 'Cliente';

  const navItems = [
    { to: '/portal', icon: LayoutDashboard, label: 'Préstamos vigentes', end: true },
    { to: '/portal/record', icon: Archive, label: 'Récord de préstamos', end: false },
    { to: '/portal/pagos', icon: DollarSign, label: 'Historial de pagos', end: false },
    { to: '/portal/pago-qr', icon: QrCode, label: 'Pagar con QR', end: false },
    { to: '/portal/ubicacion', icon: MapPin, label: 'Ubicación para visita', end: false },
    { to: '/portal/perfil', icon: UserRound, label: 'Mi perfil', end: false },
  ];

  const logout = async () => {
    try {
      await import('../../services/portalService').then(({ portalService }) =>
        portalService.revokeSession());
    } catch {
      // La limpieza local siempre debe ocurrir, aunque la sesión ya haya expirado.
    } finally {
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientName');
      localStorage.removeItem('clientEmail');
      localStorage.removeItem('clientSessionExpiresAt');
      navigate('/portal/login');
    }
  };

  return (
    <div className="portal-shell min-h-screen bg-surface-canvas flex flex-col md:flex-row">
      <aside className="hidden w-full shrink-0 flex-col border-b border-surface-border bg-white md:flex md:w-60 md:border-b-0 md:border-r">
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <img src="/branding/icono-bonexa.svg" alt="Bonexa" className="w-8 h-8 rounded-8 bg-navy-900 p-1 object-contain" />
            <div>
              <h1 className="text-sm font-bold text-navy-500 leading-tight">Bonexa</h1>
              <p className="text-[11px] text-slate-400">Portal de Cliente</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-2.5 bg-navy-50 rounded-10">
            <div className="w-9 h-9 bg-navy-100 rounded-full flex items-center justify-center">
              <User className="text-navy-500" size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-navy-500 truncate">{name}</p>
              <p className="text-xs text-slate-400">Cliente</p>
            </div>
          </div>
        </div>
        <nav aria-label="Navegación del portal" className="flex-1 px-3 md:px-4 flex md:block gap-1 overflow-x-auto md:space-y-1">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                aria-current={active ? 'page' : undefined}
                className={`w-auto md:w-full shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-8 text-sm font-medium transition-all ${
                  active
                    ? 'bg-navy-50 text-navy-500 shadow-sm'
                    : 'text-slate-500 hover:bg-surface-hover hover:text-navy-500'
                }`}
              >
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-surface-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-8 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-danger-500 transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <header className="relative flex items-center justify-between border-b border-surface-border bg-white px-5 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/branding/icono-bonexa.svg" alt="Bonexa" className="h-8 w-8 rounded-8 bg-navy-900 p-1 object-contain" />
          <div><p className="text-sm font-bold leading-tight text-navy-500">Bonexa</p><p className="text-[11px] text-slate-400">Portal de cliente</p></div>
        </div>
        <button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-label="Abrir menú de cuenta" aria-expanded={accountMenuOpen} className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-400"><User size={17} /></button>
        {accountMenuOpen && <div className="absolute right-4 top-[calc(100%+0.5rem)] z-50 w-56 rounded-12 border border-surface-border bg-white p-2 shadow-card">
          <p className="truncate px-3 py-2 text-xs font-semibold text-slate-400">{name}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-8 px-3 py-2.5 text-left text-sm font-semibold text-danger-600 hover:bg-danger-50"><LogOut size={16} /> Cerrar sesión</button>
        </div>}
      </header>
      <nav aria-label="Navegación móvil del portal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-surface-border bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_rgba(7,27,46,0.08)] backdrop-blur md:hidden">
        {navItems.map((item) => {
          const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return <button key={item.to} type="button" onClick={() => navigate(item.to)} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-8 px-1 py-1.5 text-[10px] font-semibold ${active ? 'text-accent-600' : 'text-slate-400'}`}><item.icon size={18} /><span className="truncate">{item.label === 'Pagar con QR' ? 'Pagar' : item.label === 'Ubicación para visita' ? 'Más' : item.label === 'Historial de pagos' ? 'Pagos' : item.label === 'Récord de préstamos' ? 'Récord' : item.label === 'Mi perfil' ? 'Perfil' : 'Inicio'}</span></button>;
        })}
      </nav>
      <main className="min-w-0 w-full flex-1 overflow-auto p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
