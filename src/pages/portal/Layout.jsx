import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, DollarSign, LogOut, User, QrCode } from 'lucide-react';

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem('clientName') || 'Cliente';

  const navItems = [
    { to: '/portal', icon: LayoutDashboard, label: 'Mis Préstamos', end: true },
    { to: '/portal/pagos', icon: DollarSign, label: 'Historial', end: false },
    { to: '/portal/pago-qr', icon: QrCode, label: 'Pagar con QR', end: false },
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
    <div className="min-h-screen bg-surface-canvas flex flex-col md:flex-row">
      <aside className="w-full md:w-60 shrink-0 bg-white border-b md:border-b-0 md:border-r border-surface-border flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-navy-500 to-navy-600 rounded-8 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P+</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-navy-500 leading-tight">PréstamoPlus</h1>
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
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
