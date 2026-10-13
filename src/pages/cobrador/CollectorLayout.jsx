import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, MapPinned, UserRound, Users } from 'lucide-react';
import CollectorSidebar from './Layout';

export default function CollectorLayout() {
  return (
    <div className="collector-shell flex min-h-screen flex-col bg-surface-canvas md:flex-row">
      <div className="hidden md:block"><CollectorSidebar /></div>
      <main className="min-w-0 flex-1 p-0 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>
      <nav aria-label="Navegación móvil del cobrador" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-surface-border bg-white px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {[
          { to: '/cobrador', label: 'Hoy', icon: LayoutDashboard, end: true },
          { to: '/cobrador/cobros', label: 'Clientes', icon: Users },
          { to: '/cobrador/ruta', label: 'Mapa', icon: MapPinned },
          { label: 'Perfil', icon: UserRound },
        ].map(({ to, label, icon: Icon, end }) => to ? (
          <NavLink key={label} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold transition-colors ${isActive ? 'text-navy-900' : 'text-slate-400'}`}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ) : (
          <button key={label} type="button" className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold text-slate-400">
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
