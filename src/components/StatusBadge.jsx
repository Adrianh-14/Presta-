export default function StatusBadge({ status }) {
  const raw = status;
  const s = String(raw ?? '').toLowerCase();

  const styles = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    vencido: 'bg-red-100 text-red-700',
    mora: 'bg-orange-100 text-orange-700',
    pagado: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-gray-200 text-gray-600',
    en_revision: 'bg-purple-100 text-purple-700',
  };

  const solicitudMap = { 0: 'pendiente', 1: 'en_revision', 2: 'aprobada', 3: 'rechazada', 4: 'cancelado' };
  const prestamoMap = { 0: 'activo', 1: 'vencido', 2: 'mora', 3: 'pagado', 4: 'cancelado' };
  const mapped = solicitudMap[raw] || prestamoMap[raw] || s;

  const label = mapped ? mapped.charAt(0).toUpperCase() + mapped.slice(1).replace('_', ' ') : '-';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[mapped] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}
