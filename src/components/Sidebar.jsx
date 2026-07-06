import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, LogOut, PlusSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/prestamos', icon: CreditCard, label: 'Préstamos' },
  { to: '/admin/nuevo-prestamo', icon: PlusSquare, label: 'Nuevo Préstamo' },
  { to: '/admin/solicitudes', icon: FileText, label: 'Solicitudes' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-surface-border flex flex-col">
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-navy-500 to-navy-600 rounded-8 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P+</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy-500 leading-tight">PréstamoPlus</h1>
            <p className="text-xs text-slate-400">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-8 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-navy-50 text-navy-500 shadow-sm'
                  : 'text-slate-500 hover:bg-surface-hover hover:text-navy-500'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-surface-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
            <span className="text-navy-500 font-semibold text-sm">
              {user?.nombre?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-500 truncate">{user?.nombre}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-red-50 hover:text-danger-500 rounded-8 transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
