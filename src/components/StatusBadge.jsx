export default function StatusBadge({ status }) {
  const raw = status;
  const s = String(raw ?? '').toLowerCase();

  const styles = {
    activo: 'bg-success-50 text-success-700',
    inactivo: 'bg-surface-fill text-slate-400',
    pendiente: 'bg-warning-50 text-warning-700',
    procesando: 'bg-accent-50 text-accent-600',
    aprobada: 'bg-success-50 text-success-700',
    rechazada: 'bg-danger-50 text-danger-700',
    negada: 'bg-danger-50 text-danger-700',
    vencido: 'bg-danger-50 text-danger-700',
    mora: 'bg-warning-50 text-warning-700 border border-warning-200',
    pagado: 'bg-navy-50 text-navy-500',
    cancelado: 'bg-surface-fill text-slate-400',
    legal: 'bg-red-100 text-red-900 border border-red-300',
    en_revision: 'bg-accent-50 text-accent-600',
    enrevision: 'bg-accent-50 text-accent-600',
  };

  const solicitudMap = { 0: 'pendiente', 1: 'procesando', 2: 'aprobada', 3: 'negada', 4: 'cancelado' };
  const prestamoMap = { 0: 'activo', 1: 'vencido', 2: 'mora', 3: 'pagado', 4: 'cancelado', 5: 'legal' };
  const mapped = solicitudMap[raw] || prestamoMap[raw] || s;

  const normalized = mapped === 'en_revision' || mapped === 'enrevision' ? 'procesando' : mapped;
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).replace('_', ' ') : '-';

  return (
    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${styles[normalized] || 'bg-surface-fill text-slate-400'}`}>
      {label}
    </span>
  );
}
