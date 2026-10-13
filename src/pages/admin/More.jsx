import { Building2, CreditCard, FileText, LogOut, MapPinned, PiggyBank, Receipt, Settings, ShieldCheck, UsersRound, FolderLock, Zap, ChevronRight, UserRound, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const businessGroups = [
  { title: 'Operaciones', description: 'Solicitudes, cartera y seguimiento de pagos.', items: [
    { to: '/admin/solicitudes', label: 'Solicitudes', detail: 'Revisa y decide solicitudes de préstamo', icon: FileText },
    { to: '/admin/mora', label: 'Mora y cobranza', detail: 'Da seguimiento a cuotas atrasadas', icon: CreditCard },
    { to: '/admin/gastos', label: 'Gastos', detail: 'Consulta y registra gastos operativos', icon: Receipt },
    { to: '/admin/inversiones', label: 'Inversiones', detail: 'Administra el capital invertido', icon: PiggyBank },
  ] },
  { title: 'Equipo y clientes', description: 'Personas, rutas y expedientes de la financiera.', items: [
    { to: '/admin/cobradores', label: 'Cobradores', detail: 'Gestiona el equipo de cobranza', icon: UsersRound },
    { to: '/admin/cobradores/rutas', label: 'Mapa de rutas', detail: 'Consulta las ubicaciones asignadas', icon: MapPinned },
    { to: '/admin/actualizaciones-perfil', label: 'Actualizaciones de perfil', detail: 'Aprueba cambios enviados por clientes', icon: ShieldCheck },
    { to: '/admin/garantias', label: 'Documentos y garantías', detail: 'Revisa documentos de respaldo', icon: FolderLock },
  ] },
  { title: 'Administración', description: 'Preferencias y herramientas de la cuenta.', items: [
    { to: '/admin/configuracion', label: 'Configuración', detail: 'Ajusta monedas y opciones de la empresa', icon: Settings },
  ] },
];

const platformGroups = [{ title: 'Plataforma', description: 'Administración del servicio y las empresas.', items: [
  { to: '/plataforma/empresas', label: 'Empresas', detail: 'Gestiona las financieras registradas', icon: Building2 },
  { to: '/plataforma/planes', label: 'Planes y precios', detail: 'Configura los planes disponibles', icon: CreditCard },
  { to: '/plataforma/suscripciones', label: 'Suscripciones', detail: 'Consulta las suscripciones activas', icon: Receipt },
  { to: '/plataforma/promociones', label: 'Promociones', detail: 'Administra promociones', icon: Zap },
  { to: '/plataforma/auditoria', label: 'Auditoría', detail: 'Consulta la actividad de plataforma', icon: ShieldCheck },
]}];

export default function More({ platform = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = platform ? platformGroups : businessGroups;
  const root = platform ? '/plataforma' : '/admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <section className="mx-auto max-w-4xl">
    <header className="mb-6 sm:mb-8">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent-600">{platform ? 'CENTRO DE PLATAFORMA' : 'ADMIN · OPERACIÓN'}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Más herramientas</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Todo lo que necesitas para administrar {platform ? 'Bonexa' : 'tu financiera'}, reunido en un solo lugar.</p>
    </header>

    <div className="space-y-6">
      {groups.map((group) => <section key={group.title} aria-labelledby={`more-${group.title}`}>
        <div className="mb-3"><h2 id={`more-${group.title}`} className="font-display text-lg font-bold text-navy-900">{group.title}</h2><p className="mt-0.5 text-xs text-slate-500">{group.description}</p></div>
        <div className="overflow-hidden rounded-16 border border-surface-border bg-white shadow-card">
          {group.items.map(({ to, label, detail, icon: Icon }, index) => <Link key={to} to={to} className={`group flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 sm:gap-4 sm:px-5 ${index ? 'border-t border-surface-border' : ''}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-navy-50 text-navy-700 group-hover:bg-accent-50 group-hover:text-accent-700"><Icon size={19} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-navy-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span>
            <ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-600" aria-hidden="true" />
          </Link>)}
        </div>
      </section>)}

      <section aria-label="Cuenta y sesión" className="overflow-hidden rounded-16 border border-surface-border bg-white shadow-card">
        <div className="flex items-center gap-3 p-4 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-800"><UserRound size={18} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy-900">{user?.nombre || 'Usuario'}</span><span className="block truncate text-xs text-slate-500">{user?.email || user?.role}</span></span>
          <Link to={root} aria-label="Volver al inicio" className="rounded-full p-2 text-slate-500 hover:bg-surface-canvas"><LayoutDashboard size={18} /></Link>
        </div>
        <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 border-t border-surface-border px-4 text-left text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 sm:px-5"><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>
      </section>
    </div>
  </section>;
}
