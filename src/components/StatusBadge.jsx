export default function StatusBadge({ status }) {
  const styles = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    vencido: 'bg-red-100 text-red-700',
    mora: 'bg-orange-100 text-orange-700',
    pagado: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
