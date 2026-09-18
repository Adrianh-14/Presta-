import { BriefcaseBusiness, ChevronRight, UserRound } from 'lucide-react';

export default function EntryChoice({ onSelect }) {
  return (
    <main className="min-h-screen bg-surface-canvas px-5 py-10 text-navy-800 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <img src="/branding/logo-prestamos-plus.svg" alt="Préstamos Plus" className="mx-auto h-12 w-auto max-w-[230px]" />
          <p className="mt-7 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Primer acceso</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">¿A qué portal quieres ingresar?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Selecciona el espacio que utilizas.</p>
        </div>
        <div className="grid gap-4">
          <button type="button" onClick={() => onSelect('work')} className="group flex items-center gap-4 rounded-16 border border-surface-border bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-card-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent-300">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-12 bg-navy-800 text-white"><BriefcaseBusiness size={24} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base font-bold text-navy-800">Portal de trabajo</strong><span className="mt-1 block text-sm leading-5 text-slate-500">Para superadministradores, dueños de financieras, administradores y cobradores.</span></span>
            <ChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-accent-600" size={20} />
          </button>
          <button type="button" onClick={() => onSelect('client')} className="group flex items-center gap-4 rounded-16 border border-surface-border bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-card-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent-300">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-12 bg-accent-50 text-accent-600"><UserRound size={24} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base font-bold text-navy-800">Portal de cliente</strong><span className="mt-1 block text-sm leading-5 text-slate-500">Consulta tus préstamos, cuotas, pagos e historial con tu cédula.</span></span>
            <ChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-accent-600" size={20} />
          </button>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">¿Todavía no tienes una cuenta de trabajo? Al elegir el portal de trabajo encontrarás la opción para registrar tu empresa.</p>
      </section>
    </main>
  );
}
