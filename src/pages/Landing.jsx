import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardCheck, CreditCard, Globe2, HandCoins, LayoutDashboard, MapPinned, Menu, QrCode, ShieldCheck, Smartphone, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const solutions = [
  { icon: ClipboardCheck, eyebrow: 'CARTERA', title: 'Un solo estado de cuenta', text: 'Clientes, garantías, cuotas y pagos en el mismo expediente.' },
  { icon: MapPinned, eyebrow: 'COBRO', title: 'Prioriza el día', text: 'Vencimientos, mora y visitas a la vista para todo el equipo.' },
  { icon: ShieldCheck, eyebrow: 'CONTROL', title: 'Cada movimiento deja rastro', text: 'Roles, auditoría y cierres con contexto.' },
  { icon: Smartphone, eyebrow: 'CLIENTE', title: 'Más confianza al pagar', text: 'Portal, recibos y pagos QR.' },
];

const steps = [
  ['1 · SOLICITA', 'Recibe la solicitud', 'Comparte un formulario y reúne todo en un expediente.'],
  ['2 · DECIDE', 'Aprueba con contexto', 'Historial, garantías y condiciones antes de desembolsar.'],
  ['3 · COBRA', 'Coordina la calle', 'Asigna cobradores y recibe pagos con trazabilidad.'],
  ['4 · REVISA', 'Cierra con confianza', 'Cartera, mora, gastos y auditoría en un panel.'],
];

const personas = [
  ['PRESTAMISTA', 'De la libreta a una cartera clara', 'Cuotas, cobros diarios y clientes sin perder la cercanía.', HandCoins],
  ['FINANCIERA', 'Más equipos, menos fricción', 'Roles, solicitudes, garantías, documentos y reportes.', Users],
  ['COBRADOR', 'El día se organiza en la calle', 'Asignaciones, visitas y pagos desde el móvil.', Smartphone],
];

const appScreens = [
  { label: 'Panel', caption: 'La cartera, clara desde el inicio.', image: '/app-showcase/admin-dashboard.jpg', alt: 'Panel móvil de administración de Bonexa con resumen de cartera y cobros', icon: LayoutDashboard },
  { label: 'Más herramientas', caption: 'Toda la operación, a un toque.', image: '/app-showcase/admin-more.jpg', alt: 'Menú móvil Más herramientas de Bonexa, organizado por operaciones y equipo', icon: Smartphone },
  { label: 'Préstamos', caption: 'Encuentra cada operación al instante.', image: '/app-showcase/loans-sanitized.jpg', alt: 'Pantalla móvil de préstamos de Bonexa con datos de clientes de demostración', icon: CreditCard },
  { label: 'Nuevo préstamo', caption: 'Inicia una operación desde el móvil.', image: '/app-showcase/new-loan-sanitized.jpg', alt: 'Pantalla móvil de registro rápido de préstamo con código QR de demostración no funcional', icon: CircleDollarSign },
  { label: 'Clientes', caption: 'Expedientes y registro en un solo lugar.', image: '/app-showcase/clients-sanitized.jpg', alt: 'Pantalla móvil de clientes de Bonexa con datos de demostración', icon: Users },
  { label: 'Portal cliente', caption: 'Cada cliente consulta lo suyo.', image: '/app-showcase/client-loans.jpg', alt: 'Portal móvil del cliente con préstamos vigentes y acceso a solicitar otro préstamo', icon: Users },
  { label: 'Récord', caption: 'Un historial que da tranquilidad.', image: '/app-showcase/loan-record.jpg', alt: 'Récord móvil de préstamos liquidados en el portal de cliente Bonexa', icon: CreditCard },
  { label: 'Pago con QR', caption: 'Pagar en persona, sin complicaciones.', image: '/app-showcase/qr-payment.jpg', alt: 'Pantalla móvil para escanear el código QR de un cobrador', icon: QrCode },
];

const currencies = [
  ['DOP', 'Peso dominicano', 'DO'], ['USD', 'Dólar estadounidense', 'US'], ['EUR', 'Euro', 'EU'],
  ['MXN', 'Peso mexicano', 'MX'], ['GTQ', 'Quetzal', 'GT'], ['HNL', 'Lempira', 'HN'],
  ['NIO', 'Córdoba', 'NI'], ['CRC', 'Colón', 'CR'], ['PAB', 'Balboa', 'PA'],
  ['COP', 'Peso colombiano', 'CO'], ['PEN', 'Sol', 'PE'], ['BRL', 'Real', 'BR'],
  ['ARS', 'Peso argentino', 'AR'], ['CLP', 'Peso chileno', 'CL'], ['CAD', 'Dólar canadiense', 'CA'], ['GBP', 'Libra esterlina', 'GB'],
];

function Flag({ country }) {
  const common = { width: 36, height: 24, viewBox: '0 0 30 20', className: 'shrink-0 rounded-[4px] shadow-[0_0_0_1px_rgba(7,27,46,.14)]', 'aria-hidden': true };
  const stripe = (colors) => colors.map((color, index) => <rect key={color} y={(20 / colors.length) * index} width="30" height={20 / colors.length} fill={color} />);
  const flags = {
    DO: <><rect width="30" height="20" fill="#fff" /><rect width="12" height="8" fill="#002d62" /><rect x="18" width="12" height="8" fill="#ce1126" /><rect y="12" width="12" height="8" fill="#ce1126" /><rect x="18" y="12" width="12" height="8" fill="#002d62" /><path d="M14 0h2v20h-2zM0 9h30v2H0z" fill="#fff" /></>,
    US: <>{stripe(['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234'])}<rect width="13" height="10.8" fill="#3c3b6e" /></>,
    EU: <><rect width="30" height="20" fill="#039" /><circle cx="15" cy="10" r="5.5" fill="none" stroke="#fc0" strokeWidth="2" strokeDasharray="1 2.1" /></>,
    MX: <><rect width="10" height="20" fill="#006847" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ce1126" /><circle cx="15" cy="10" r="2" fill="#8c5a2b" /></>,
    GT: <><rect width="30" height="20" fill="#4997d0" /><rect x="10" width="10" height="20" fill="#fff" /><circle cx="15" cy="10" r="2.2" fill="#3a8b4a" /></>,
    HN: <><rect width="30" height="20" fill="#0073cf" /><rect y="7" width="30" height="6" fill="#fff" /><circle cx="12" cy="10" r="1" fill="#0073cf" /><circle cx="15" cy="10" r="1" fill="#0073cf" /><circle cx="18" cy="10" r="1" fill="#0073cf" /></>,
    NI: <><rect width="30" height="20" fill="#0067c6" /><rect y="7" width="30" height="6" fill="#fff" /><circle cx="15" cy="10" r="2" fill="#d9a400" /></>,
    CR: <><rect width="30" height="20" fill="#002b7f" /><rect y="3.3" width="30" height="13.4" fill="#fff" /><rect y="6.7" width="30" height="6.6" fill="#ce1126" /></>,
    PA: <><rect width="15" height="10" fill="#fff" /><rect x="15" width="15" height="10" fill="#d21034" /><rect y="10" width="15" height="10" fill="#005293" /><rect x="15" y="10" width="15" height="10" fill="#fff" /><circle cx="7.5" cy="5" r="2" fill="#005293" /><circle cx="22.5" cy="15" r="2" fill="#d21034" /></>,
    CO: <><rect width="30" height="10" fill="#fcd116" /><rect y="10" width="30" height="5" fill="#003893" /><rect y="15" width="30" height="5" fill="#ce1126" /></>,
    PE: <><rect width="10" height="20" fill="#d91023" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#d91023" /></>,
    BR: <><rect width="30" height="20" fill="#009b3a" /><path d="M15 2L28 10 15 18 2 10z" fill="#ffdf00" /><circle cx="15" cy="10" r="5" fill="#002776" /></>,
    AR: <><rect width="30" height="6.7" fill="#74acdf" /><rect y="6.7" width="30" height="6.6" fill="#fff" /><rect y="13.3" width="30" height="6.7" fill="#74acdf" /><circle cx="15" cy="10" r="1.8" fill="#f6b40e" /></>,
    CL: <><rect width="30" height="10" fill="#fff" /><rect y="10" width="30" height="10" fill="#d52b1e" /><rect width="12" height="10" fill="#0039a6" /><polygon points="6,2 6.8,4.5 9.5,4.5 7.3,6.1 8.1,8.6 6,7.1 3.9,8.6 4.7,6.1 2.5,4.5 5.2,4.5" fill="#fff" /></>,
    CA: <><rect width="7" height="20" fill="#d52b1e" /><rect x="7" width="16" height="20" fill="#fff" /><rect x="23" width="7" height="20" fill="#d52b1e" /><path d="M15 4l1 4 3-1-2 3 3 2-4 .2.3 4-2.3-3-2.3 3 .3-4-4-.2 3-2-2-3 3 1z" fill="#d52b1e" /></>,
    GB: <><rect width="30" height="20" fill="#012169" /><path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="2" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" /><path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3" /></>,
  };
  return <svg {...common}>{flags[country] || <rect width="30" height="20" fill="#d5dee7" />}</svg>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const selectedScreen = appScreens[activeScreen];
  const showPreviousScreen = () => setActiveScreen((index) => (index - 1 + appScreens.length) % appScreens.length);
  const showNextScreen = () => setActiveScreen((index) => (index + 1) % appScreens.length);
  return (
    <main className="overflow-hidden bg-surface-canvas text-navy-900">
      <header className="sticky top-0 z-20 border-b border-navy-900/10 bg-surface-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Bonexa, inicio">
            <img src="/branding/icono-bonexa.svg" alt="" className="h-9 w-9 rounded-8" />
            <span className="font-display text-xl font-extrabold tracking-tight">Bonexa</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#ciclo" className="transition hover:text-navy-900">Cómo funciona</a>
            <a href="#soluciones" className="transition hover:text-navy-900">Soluciones</a>
            <a href="#app-movil" className="transition hover:text-navy-900">App móvil</a>
            <a href="#simulador" className="transition hover:text-navy-900">Calculadora</a>
            <a href="#monedas" className="transition hover:text-navy-900">Multimoneda</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="px-3 py-2 text-sm font-bold text-navy-700">Iniciar sesión</Link>
            <Link to="/registro" className="rounded-8 bg-navy-900 px-4 py-2.5 text-sm font-bold text-white shadow-btn transition hover:bg-navy-700">Comenzar gratis</Link>
          </div>
          <button type="button" className="rounded-8 p-2 md:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && <div className="border-t border-navy-900/10 px-5 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm font-semibold"><a href="#ciclo" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a href="#soluciones" onClick={() => setMenuOpen(false)}>Soluciones</a><a href="#app-movil" onClick={() => setMenuOpen(false)}>App móvil</a><a href="#simulador" onClick={() => setMenuOpen(false)}>Calculadora</a><a href="#monedas" onClick={() => setMenuOpen(false)}>Multimoneda</a><Link to="/login">Iniciar sesión</Link><Link to="/registro" className="rounded-8 bg-navy-900 px-4 py-3 text-center text-white">Comenzar gratis</Link></div></div>}
      </header>

      <section className="financial-grid relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
          <div className="relative z-10">
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-warning-500">Software para prestamistas en Rep. Dominicana</p>
            <h1 className="max-w-2xl font-display text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-white sm:text-6xl lg:text-7xl">Cada peso prestado.<br /><span className="text-warning-500">Cada cuota.</span><br />Bajo control.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200">Clientes, préstamos, cobros, mora y cobradores en un solo lugar. Gratis y desde tu celular.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/registro" className="inline-flex items-center justify-center gap-2 rounded-8 bg-warning-500 px-5 py-3.5 text-sm font-extrabold text-navy-900 shadow-btn transition hover:bg-warning-400">Comenzar gratis <ArrowRight size={17} /></Link><a href="#simulador" className="inline-flex items-center justify-center gap-2 rounded-8 border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Probar el simulador</a></div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-300"><span className="flex items-center gap-2"><Check size={15} className="text-warning-500" />100% gratuito</span><span className="flex items-center gap-2"><Check size={15} className="text-warning-500" />Sin tarjeta</span><span className="flex items-center gap-2"><Check size={15} className="text-warning-500" />Acceso desde el celular</span></div>
            <p className="mt-5 text-xs text-slate-400">Bonexa es software. No otorgamos préstamos ni intermediamos dinero.</p>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -right-12 -top-10 h-56 w-56 rounded-full border-[34px] border-warning-500/10" />
            <div className="relative rounded-16 border border-white/15 bg-white p-5 shadow-card-lg sm:p-7">
              <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-warning-700">CARTERA ACTIVA · EJEMPLO</p><p className="mt-2 font-display text-3xl font-extrabold text-navy-900">RD$2,480,500</p></div><span className="rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700">EN VIVO</span></div>
              <div className="mt-6 space-y-3"><div className="flex items-center justify-between rounded-8 bg-surface-canvas p-3"><div><p className="text-sm font-bold text-navy-900">María G.</p><p className="text-xs text-slate-500">Cuota 7 de 12 · Quincenal</p></div><span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">Al día</span></div><div className="flex items-center justify-between rounded-8 bg-surface-canvas p-3"><div><p className="text-sm font-bold text-navy-900">José R.</p><p className="text-xs text-slate-500">Vencida · 2 días</p></div><span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-bold text-warning-700">Revisar</span></div><div className="flex items-center justify-between rounded-8 bg-surface-canvas p-3"><div><p className="text-sm font-bold text-navy-900">Andrea L.</p><p className="text-xs text-slate-500">Pago recibido · QR</p></div><span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-700">Conciliado</span></div></div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-surface-border pt-4 text-sm"><div><p className="text-xs text-slate-500">Próximo cobro</p><p className="mt-1 font-display font-extrabold text-navy-900">RD$18,650</p></div><div><p className="text-xs text-slate-500">Recuperación</p><p className="mt-1 font-display font-extrabold text-navy-900">94.2%</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="app-movil" className="relative isolate overflow-hidden bg-navy-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,181,71,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,181,71,.08)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div aria-hidden="true" className="absolute -right-40 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-warning-500/15 blur-[100px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
          <div className="relative z-10 max-w-xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-warning-500">Bonexa en tu bolsillo</p>
            <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-6xl">Una operación moderna.<br /><span className="text-warning-500">También en móvil.</span></h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Administra tu cartera, organiza los cobros y permite que tus clientes consulten sus préstamos desde una experiencia hecha para el teléfono.</p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
              <span className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2">Panel de administración</span>
              <span className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2">Portal de cliente</span>
              <span className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2">Cobros con QR</span>
            </div>
            <Link to="/registro" className="mt-9 inline-flex items-center gap-2 rounded-8 bg-warning-500 px-5 py-3.5 text-sm font-extrabold text-navy-900 shadow-btn transition hover:-translate-y-0.5 hover:bg-warning-400">Quiero conocer Bonexa <ArrowRight size={17} /></Link>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl flex-col items-center">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.08] sm:h-[38rem] sm:w-[38rem]" />
            <div className="relative rounded-[43px] border border-white/25 bg-gradient-to-br from-slate-400 via-slate-700 to-navy-950 p-[9px] shadow-[0_40px_110px_rgba(0,0,0,.55)] sm:p-[11px]">
              <span aria-hidden="true" className="absolute -right-[4px] top-28 h-16 w-[4px] rounded-r-full bg-slate-500" />
              <span aria-hidden="true" className="absolute -left-[4px] top-24 h-12 w-[4px] rounded-l-full bg-slate-500" />
              <div className="overflow-hidden rounded-[34px] bg-surface-canvas p-1">
                <img key={selectedScreen.image} src={`${selectedScreen.image}?v=2`} alt={selectedScreen.alt} className="phone-showcase-shot block aspect-[.37] w-[min(72vw,286px)] rounded-[29px] object-contain sm:w-[300px]" />
              </div>
            </div>
            <div className="mt-6 flex w-full max-w-[430px] items-center justify-between gap-3">
              <button type="button" onClick={showPreviousScreen} aria-label="Ver pantalla anterior" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-warning-500 hover:text-warning-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning-500"><ChevronLeft size={19} /></button>
              <div className="min-w-0 flex-1 text-center" aria-live="polite">
                <p className="text-sm font-bold text-white">{selectedScreen.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{selectedScreen.caption}</p>
              </div>
              <button type="button" onClick={showNextScreen} aria-label="Ver pantalla siguiente" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-warning-500 hover:text-warning-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning-500"><ChevronRight size={19} /></button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Elegir pantalla de la aplicación móvil">
              {appScreens.map(({ label, icon: Icon }, index) => <button key={label} type="button" onClick={() => setActiveScreen(index)} aria-label={`Mostrar ${label}`} aria-pressed={activeScreen === index} className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning-500 ${activeScreen === index ? 'border-warning-500 bg-warning-500 text-navy-900' : 'border-white/15 bg-white/[.04] text-slate-300 hover:border-white/40 hover:text-white'}`}><Icon size={14} aria-hidden="true" />{label}</button>)}
            </div>
          </div>
        </div>
      </section>

      <section id="soluciones" className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-warning-700">Menos libretas. Más claridad.</p><h2 className="mt-3 font-display text-4xl font-extrabold leading-tight text-navy-900 sm:text-5xl">Lo que antes vivía separado, ahora en un mismo lugar.</h2></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{solutions.map(({ icon: Icon, eyebrow, title, text }) => <article key={eyebrow} className="rounded-16 border border-surface-border bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-lg"><div className="mb-10 flex h-11 w-11 items-center justify-center rounded-12 bg-warning-50 text-warning-700"><Icon size={21} /></div><p className="font-mono text-[10px] font-bold tracking-[.16em] text-warning-700">{eyebrow}</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></section>

      <section id="ciclo" className="border-y border-surface-border bg-white"><div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-warning-700">Una operación de principio a fin</p><h2 className="mt-3 font-display text-4xl font-extrabold text-navy-900 sm:text-5xl">Del primer dato al último pago.</h2></div><CircleDollarSign className="hidden text-warning-500 sm:block" size={48} strokeWidth={1.5} /></div><div className="mt-14 grid gap-8 border-t border-surface-border pt-8 md:grid-cols-4">{steps.map(([label, title, text]) => <div key={label}><p className="font-mono text-[10px] font-bold tracking-[.12em] text-warning-700">{label}</p><h3 className="mt-4 font-display text-xl font-extrabold text-navy-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></div>)}</div></div></section>

      <section id="simulador" className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-8 rounded-16 bg-navy-900 p-8 text-white sm:p-12 md:grid-cols-[1fr_.85fr] md:items-center"><div><h2 className="font-display text-3xl font-extrabold sm:text-4xl">Calcula una cuota en segundos</h2><p className="mt-3 max-w-lg text-slate-300">Ajusta un préstamo de ejemplo y mira cómo cambia el seguimiento.</p><div className="mt-7 space-y-2 text-sm"><div className="flex justify-between rounded-8 bg-navy-800 px-4 py-3"><span>Monto</span><strong>RD$80,000</strong></div><div className="flex justify-between rounded-8 bg-navy-800 px-4 py-3"><span>Interés anual</span><strong>18%</strong></div><div className="flex justify-between rounded-8 bg-navy-800 px-4 py-3"><span>Plazo</span><strong>12 meses</strong></div></div><div className="mt-3 flex gap-2 text-sm"><span className="rounded-8 bg-warning-500 px-3 py-2 font-bold text-navy-900">Mensual</span><span className="rounded-8 border border-white/20 px-3 py-2">Quincenal</span><span className="rounded-8 border border-white/20 px-3 py-2">Semanal</span></div></div><div className="rounded-12 bg-surface-canvas p-7 text-navy-900"><p className="text-sm text-slate-500">Cuota estimada</p><p className="font-display text-4xl font-extrabold">RD$7,335</p><p className="mt-1 text-sm text-slate-500">Primera cuota: en 30 días</p><div className="mt-5 space-y-2 border-t border-surface-border pt-3 text-sm"><div className="flex justify-between"><span>Total a cobrar</span><strong>RD$88,020</strong></div><div className="flex justify-between border-t border-surface-border pt-2"><span>Interés estimado</span><strong>RD$8,020</strong></div></div><Link to="/registro" className="mt-5 block rounded-8 bg-navy-900 px-4 py-3 text-center text-sm font-bold text-white">Crear mi primer préstamo</Link><p className="mt-3 text-[11px] leading-4 text-slate-500">Ejemplo educativo. Tasas y condiciones las define tu negocio y deben cumplir la normativa aplicable.</p></div></div></section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24"><h2 className="font-display text-4xl font-extrabold text-navy-900 sm:text-5xl">Para cada forma de prestar</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{personas.map(([eyebrow, title, text, Icon]) => <article key={eyebrow} className="rounded-16 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-lg"><Icon className="mb-8 text-warning-700" size={25} /><p className="font-mono text-xs font-bold tracking-[.16em] text-warning-700">{eyebrow}</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p><span className="mt-5 inline-block text-sm font-bold text-navy-900">Ver solución →</span></article>)}</div></section>

      <section id="monedas" className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-20"><div className="flex items-start justify-between gap-6"><div><h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Multimoneda, sin mezclar saldos</h2><p className="mt-3 max-w-2xl text-slate-600">Cada operación en su moneda. Tu empresa activa las que necesita desde su configuración.</p></div><Globe2 className="hidden text-warning-500 sm:block" size={40} /></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{currencies.map(([code, name, country]) => <div key={code} className="flex items-center gap-3 rounded-8 bg-white px-4 py-3 shadow-card"><Flag country={country} /><div><strong className="text-sm text-navy-900">{code}</strong><p className="text-xs text-slate-500">{name}</p></div></div>)}</div></section>

      <section id="registro" className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24"><div className="flex flex-wrap items-center justify-between gap-6 rounded-16 bg-warning-500 px-8 py-10 text-navy-900 sm:px-12"><h2 className="max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">Pon tu cartera en orden. Empieza gratis.</h2><Link to="/registro" className="inline-flex items-center gap-2 rounded-8 bg-navy-900 px-6 py-4 text-sm font-bold text-white">Comenzar gratis <ArrowRight size={17} /></Link></div></section>

      <footer className="bg-navy-900 text-white"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm opacity-80 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 Bonexa · Software gratuito para negocios de crédito</span><span>República Dominicana y Latinoamérica</span></div></footer>
    </main>
  );
}
