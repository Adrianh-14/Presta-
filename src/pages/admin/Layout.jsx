import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/clientes', label: 'Clientes', icon: Users },
  { path: '/admin/prestamos', label: 'Préstamos', icon: CreditCard },
  { path: '/admin/solicitudes', label: 'Solicitudes', icon: FileText },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-primary-800 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">PréstamoPlus</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-primary-700">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-primary-700 transition-colors ${isActive ? 'bg-primary-700 border-r-4 border-white' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800">Panel de Administración</h2>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
