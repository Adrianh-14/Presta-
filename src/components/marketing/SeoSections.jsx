const links = [
  ['/software-para-prestamistas/', 'Software para prestamistas', 'Organiza clientes, cuotas y pagos desde el celular.'],
  ['/software-para-financieras/', 'Software para financieras', 'Comparte la operación con tu equipo y controla accesos.'],
  ['/sistema-de-cobranza/', 'Sistema de cobranza', 'Revisa vencimientos, pagos parciales y seguimiento de mora.'],
  ['/app-para-cobradores/', 'App para cobradores', 'Consulta asignaciones y registra el resultado de cada visita.'],
  ['/gestion-cartera-prestamos/', 'Gestión de cartera de préstamos', 'Consulta capital, intereses e historial por operación.'],
  ['/recursos/', 'Guías y plantillas gratuitas', 'Aprende a organizar cartera, amortización y cobranza.'],
];
export default function SeoSections() {
  return <>
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><h2 className="font-display text-3xl font-extrabold">Elige qué necesitas organizar</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{links.map(([url, title, text]) => <a key={url} href={url} className="rounded-12 border border-surface-border bg-white p-6 shadow-card"><h3 className="text-lg font-bold">{title} →</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></a>)}</div></section>
    <section className="border-y border-surface-border bg-white"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 lg:px-8"><div><h2 className="font-display text-3xl font-extrabold">Qué incluye el acceso gratuito</h2><p className="mt-4 leading-7 text-slate-600">Las nuevas cuentas comienzan sin tarjeta, con capacidad inicial de 100 clientes, 50 préstamos activos y 3 usuarios. Consulta las condiciones y el alcance antes de trasladar tu cartera.</p><a href="/precios/" className="mt-5 inline-block font-bold underline">Ver condiciones del acceso gratuito →</a></div><div><h2 className="font-display text-3xl font-extrabold">Conoce el producto antes de empezar</h2><p className="mt-4 leading-7 text-slate-600">Las capturas muestran pantallas del producto con información de demostración. Puedes explorar el panel y el portal de clientes, revisar cómo se controlan los accesos y consultar al equipo.</p><div className="mt-5 flex flex-wrap gap-5 font-bold underline"><a href="/seguridad/">Seguridad y datos</a><a href="/contacto/">Contacto y soporte</a></div></div></div></section>
    <section className="mx-auto max-w-3xl px-5 py-16"><h2 className="font-display text-3xl font-extrabold">Preguntas sobre Bonexa</h2><div className="mt-7 divide-y divide-surface-border">{[
      ['¿Bonexa presta dinero?', 'No. Bonexa es software para administrar préstamos de tu propio negocio. No concede créditos ni intermedia desembolsos.'],
      ['¿Puedo usarlo desde mi teléfono?', 'Sí. La plataforma web permite acceder desde el navegador del teléfono o de la computadora. El portal del cobrador y el del cliente ofrecen vistas para sus tareas.'],
      ['¿Qué pasa si ya tengo mi cartera en Excel?', 'Primero concilia los saldos y reúne los expedientes. Registra y verifica una muestra antes de trasladar toda la operación; no se promete una importación automática. La guía de cartera explica el proceso.'],
      ['¿Puedo manejar pesos dominicanos y dólares?', 'La plataforma permite habilitar monedas y registrar operaciones en su moneda. No sumes DOP y USD como si fueran el mismo saldo.'],
      ['¿Necesito instalar una aplicación para empezar?', 'Puedes comenzar por la web. Para registrar visitas, usar cámara o ubicación, el navegador puede solicitar los permisos correspondientes.'],
    ].map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div></section>
  </>;
}

export function MarketingFooter() {
  return <footer className="bg-navy-900 text-white"><div className="mx-auto max-w-6xl px-5 py-10 lg:px-8"><p className="font-display text-xl font-bold">Bonexa</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Software para gestionar préstamos y cobranza en República Dominicana. Cada peso prestado. Cada cuota. Bajo control.</p><nav aria-label="Recursos y soluciones" className="my-7 grid gap-4 text-sm sm:grid-cols-3">{links.map(([url,title]) => <a key={url} href={url} className="hover:underline">{title}</a>)}<a href="/precios/">Acceso gratuito y límites</a><a href="/contacto/">Contacto</a><a href="/seguridad/">Seguridad</a><a href="/calculadora-prestamos/">Calculadora de préstamos</a><a href="/en/" lang="en">English</a><a href="mailto:adrien1138@gmail.com">adrien1138@gmail.com</a><a href="https://wa.me/18296908175">WhatsApp: +1 829 690 8175</a></nav><p className="border-t border-white/15 pt-5 text-xs text-slate-400">© 2026 Bonexa · Bonexa es software; no otorga préstamos.</p></div></footer>;
}
