import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, CreditCard, LayoutDashboard, MoreHorizontal, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ProductGuide from '../../components/ProductGuide';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isPlatform = ['SuperAdmin', 'PlatformAdmin', 'AdministradorPlataforma'].includes(user?.role) || location.pathname.startsWith('/plataforma');
  const mobileItems = isPlatform
    ? [
      { to: '/plataforma', label: 'Inicio', icon: LayoutDashboard, end: true },
      { to: '/plataforma/empresas', label: 'Empresas', icon: Building2 },
      { to: '/plataforma/planes', label: 'Planes', icon: CreditCard },
      { to: '/plataforma/suscripciones', label: 'Más', icon: MoreHorizontal },
    ]
    : [
      { to: '/admin', label: 'Inicio', icon: LayoutDashboard, end: true },
      { to: '/admin/clientes', label: 'Clientes', icon: Building2 },
      { to: '/admin/nuevo-prestamo', label: 'Nuevo', icon: Plus, action: true },
      { to: '/admin/prestamos', label: 'Cobros', icon: CreditCard },
      { to: '/admin/configuracion', label: 'Más', icon: MoreHorizontal },
    ];

  return (
    <div className="admin-shell flex min-h-screen bg-surface-canvas text-navy-900">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-20 sm:px-6 md:p-8 md:pb-8 lg:px-11 lg:py-9">
        <div className="mx-auto w-full max-w-[1480px]"><Outlet /></div>
      </main>
      <nav aria-label="Navegación móvil de administración" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-surface-border bg-white px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {mobileItems.map(({ to, label, icon: Icon, end, action }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${action ? 'relative -mt-5' : ''} ${isActive ? 'text-navy-900' : 'text-slate-400'}`}>
          <span className={action ? 'flex h-12 w-12 items-center justify-center rounded-full bg-warning-500 text-navy-900 shadow-btn' : 'flex h-7 items-center justify-center'}><Icon size={action ? 25 : 18} aria-hidden="true" /></span>
          <span>{label}</span>
        </NavLink>)}
      </nav>
      <ProductGuide />
    </div>
  );
}
