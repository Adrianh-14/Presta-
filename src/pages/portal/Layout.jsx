import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, DollarSign, LogOut, User } from 'lucide-react';

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem('clientName') || 'Cliente';

  const navItems = [
    { to: '/portal', icon: LayoutDashboard, label: 'Mis Préstamos', end: true },
    { to: '/portal/pagos', icon: DollarSign, label: 'Historial de Pagos', end: false },
  ];

  const logout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientName');
    localStorage.removeItem('clientEmail');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-bold text-primary-600">PréstamoPlus</h1>
          <p className="text-xs text-gray-500">Portal de Cliente</p>
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500">Cliente</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
