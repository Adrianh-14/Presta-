import { useState, useEffect } from 'react';
import { Search, UserPlus, QrCode, ArrowRight, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ClienteDetailModal from '../../components/modals/ClienteDetailModal';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { formatDateOnly } from '../../utils/dateOnly';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado', render: (value) => <StatusBadge status={value} /> },
  { key: 'fechaRegistro', label: 'Registro', render: (value) => value ? formatDateOnly(value) : '-' },
];

export default function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const tenantId = user?.tenantId || (() => {
    try { return JSON.parse(atob(localStorage.getItem('accessToken')?.split('.')[1] || '')).tenantId || ''; } catch { return ''; }
  })();
  const registrationUrl = tenantId ? `/solicitud?mode=client&tenant=${tenantId}&source=admin&v=2` : '/solicitud?mode=client&source=admin&v=2';

  useEffect(() => {
    let active = true;
    setLoading(true);
    const estado = filtro === 'todos' ? '' : filtro;
    clientService.getAll(search, estado)
      .then((data) => { if (active) setClientes(data); })
      .catch((err) => console.error('Error loading clients:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, filtro]);

  const handleRowClick = async (row) => {
    setDetailLoading(true);
    try {
      const full = await clientService.getById(row.id);
      setSelectedClient(full);
    } catch {
      setSelectedClient(row);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="md:hidden">
        <div className="mb-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cartera</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">{clientes.length} clientes registrados</p>
        </div>

        <section className="mb-6 rounded-16 border border-accent-100 bg-gradient-to-br from-white via-white to-accent-50/60 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-12 bg-accent-100 text-accent-600">
              <UsersRound size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-500">Tu cartera empieza aquí</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Registra un cliente o comparte un QR para que complete sus datos desde su teléfono.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Link to={registrationUrl} className="inline-flex items-center justify-center gap-2 rounded-8 bg-navy-500 px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-navy-600">
              <UserPlus size={16} /> Registrar cliente
            </Link>
            <Link to="/admin/nuevo-prestamo" className="inline-flex items-center justify-center gap-2 rounded-8 border border-accent-200 bg-white px-4 py-2.5 text-sm font-semibold text-accent-600 transition hover:bg-accent-50">
              <QrCode size={16} /> Abrir QR de registro <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 rounded-16 border border-surface-border bg-white p-4 shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar cliente…" value={search} onChange={(e) => setSearch(e.target.value)} className="auth-input w-full pl-10" />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-8 border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100">
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        {loading ? <p className="py-8 text-center text-gray-500">Cargando clientes...</p> : clientes.length === 0 ? (
          <div className="rounded-16 border border-dashed border-surface-border bg-white px-5 py-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-accent-500"><UsersRound size={26} /></div>
            <h2 className="text-lg font-bold text-navy-500">Todavía no tienes clientes</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Registra el primero o envíale el QR para que se inscriba por su cuenta.</p>
            <Link to={registrationUrl} className="mt-5 inline-flex items-center gap-2 rounded-8 bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-accent-600"><UserPlus size={16} /> Registrar el primer cliente</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map((client) => (
              <button key={client.id} type="button" onClick={() => handleRowClick(client)} className="flex w-full items-center justify-between rounded-16 border border-surface-border bg-white p-4 text-left shadow-card transition hover:border-accent-200">
                <span className="min-w-0"><span className="block truncate font-bold text-navy-800">{client.nombre}</span><span className="mt-1 block text-xs text-slate-500">{client.cedula || client.email || 'Sin datos adicionales'}</span></span>
                <StatusBadge status={client.estado} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Cartera</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">{clientes.length} clientes registrados</p>
        </div>
      </div>

      <section className="mb-8 rounded-16 border border-accent-100 bg-gradient-to-br from-white via-white to-accent-50/60 p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-12 bg-accent-100 text-accent-600">
              <UsersRound size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-500">Tu cartera empieza aquí</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Registra un cliente directamente o comparte un QR para que complete sus datos desde su teléfono. Cada registro queda asociado a tu empresa.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={registrationUrl} className="inline-flex items-center justify-center gap-2 rounded-8 bg-navy-500 px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-navy-600">
              <UserPlus size={16} /> Registrar cliente
            </Link>
            <Link to="/admin/nuevo-prestamo" className="inline-flex items-center justify-center gap-2 rounded-8 border border-accent-200 bg-white px-4 py-2.5 text-sm font-semibold text-accent-600 transition hover:bg-accent-50">
              <QrCode size={16} /> Abrir QR de registro <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 rounded-16 border border-surface-border bg-white p-4 shadow-card sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="auth-input w-full pl-10"
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="rounded-8 border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Cargando clientes...</p>
      ) : clientes.length === 0 ? (
        <div className="rounded-16 border border-dashed border-surface-border bg-white px-6 py-14 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-accent-500"><UsersRound size={26} /></div>
          <h2 className="text-lg font-bold text-navy-500">Todavía no tienes clientes</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Comienza registrando el primer cliente manualmente o envíale el QR de inscripción para que lo complete por su cuenta.</p>
          <Link to={registrationUrl} className="mt-5 inline-flex items-center gap-2 rounded-8 bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-accent-600"><UserPlus size={16} /> Registrar el primer cliente</Link>
          <div className="mx-auto mt-7 max-w-sm rounded-16 border border-surface-border bg-surface-canvas p-5 text-left md:hidden">
            <div className="flex flex-col items-center text-center">
              <QRCodeSVG value={`${window.location.origin}${registrationUrl}`} size={148} level="H" includeMargin fgColor="#071b2e" className="rounded-8 bg-white p-2" />
              <p className="mt-4 font-mono text-[10px] font-bold tracking-[0.14em] text-warning-700">QR ESTÁTICO DE SOLICITUDES</p>
              <p className="mt-1 font-display text-lg font-extrabold text-navy-800">Un código para tus redes y sucursales</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Permanente y exclusivo de tu empresa. Las solicitudes llegan a tu panel.</p>
              <div className="mt-4 flex w-full flex-col gap-2">
                <button type="button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${registrationUrl}`)} className="rounded-8 border border-navy-900 px-4 py-2.5 text-sm font-bold text-navy-900">Copiar enlace</button>
                <a href={`${window.location.origin}${registrationUrl}`} target="_blank" rel="noreferrer" className="rounded-8 border border-navy-900 px-4 py-2.5 text-center text-sm font-bold text-navy-900">Abrir solicitud →</a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={clientes} onRowClick={handleRowClick} />
      )}
      </div>

      {selectedClient && (
        <ClienteDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </div>
  );
}
