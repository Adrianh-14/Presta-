import { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin, CheckCircle, XCircle, TrendingUp, QrCode } from 'lucide-react';
import KPICard from '../../components/KPICard';
import StatusBadge from '../../components/StatusBadge';
import { cobradorService } from '../../services/cobradorService';
import AssignLoansModal from '../../components/modals/AssignLoansModal';
import QRManagementModal from '../../components/modals/QRManagementModal';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;

export default function Cobradores() {
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [showQRManage, setShowQRManage] = useState(null);

  useEffect(() => { loadCollectors(); }, []);

  const loadCollectors = async () => {
    try {
      const data = await cobradorService.getAll();
      setCollectors(data);
    } catch (err) {
      console.error('Error loading collectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await cobradorService.create({
        email: form.get('email'),
        password: form.get('password'),
        nombre: form.get('nombre'),
        cedula: form.get('cedula'),
        telefono: form.get('telefono'),
        zona: form.get('zona'),
      });
      setShowCreate(false);
      loadCollectors();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear cobrador');
    }
  };

  const filtered = collectors.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.cedula.includes(search) ||
    c.zona.toLowerCase().includes(search.toLowerCase())
  );

  const totalAsignados = collectors.reduce((s, c) => s + c.totalAsignados, 0);
  const totalCobros = collectors.reduce((s, c) => s + c.cobrosExitosos, 0);
  const totalMonto = collectors.reduce((s, c) => s + c.montoCobrado, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Cargando cobradores...</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Cobradores</h1>
          <p className="text-slate-400 text-sm">Gestión de cobradores y asignaciones</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-8 text-sm font-semibold shadow-btn hover:shadow-card-lg transition-all">
          <Plus size={16} /> Nuevo Cobrador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard title="Total Cobradores" value={collectors.length} icon={Users} color="navy" />
        <KPICard title="Préstamos Asignados" value={totalAsignados} icon={TrendingUp} color="accent" />
        <KPICard title="Monto Cobrado" value={fmt(totalMonto)} icon={CheckCircle} color="success" />
      </div>

      <div className="bg-white rounded-12 shadow-card border border-surface-border mb-6">
        <div className="p-4 border-b border-surface-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-surface-border">
                <th className="px-6 py-3 font-semibold">Cobrador</th>
                <th className="px-6 py-3 font-semibold">Zona</th>
                <th className="px-6 py-3 font-semibold">Asignados</th>
                <th className="px-6 py-3 font-semibold">Exitosos</th>
                <th className="px-6 py-3 font-semibold">Monto Cobrado</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No hay cobradores registrados</td></tr>
              ) : filtered.map((collector) => (
                <tr key={collector.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy-50 rounded-full flex items-center justify-center">
                        <span className="text-navy-500 font-semibold text-sm">{collector.nombre?.charAt(0) || 'C'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-500">{collector.nombre}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {collector.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={12} /> {collector.zona}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-navy-500">{collector.totalAsignados}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-success-500">{collector.cobrosExitosos}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-accent-500">{fmt(collector.montoCobrado)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${collector.isActive ? 'bg-success-50 text-success-600' : 'bg-slate-100 text-slate-500'}`}>
                      {collector.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {collector.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowQRManage(collector)} className="text-xs font-semibold text-navy-500 hover:text-navy-600 transition-colors flex items-center gap-1">
                        <QrCode size={12} /> QR
                      </button>
                      <button onClick={() => setShowAssign(collector)} className="text-xs font-semibold text-accent-500 hover:text-accent-600 transition-colors">
                        Asignar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-16 shadow-card-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-surface-border">
              <h2 className="text-lg font-bold text-navy-500">Nuevo Cobrador</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                  <input name="nombre" required className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Cédula</label>
                  <input name="cedula" required className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                <input name="email" type="email" required className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Teléfono</label>
                  <input name="telefono" required className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Zona</label>
                  <input name="zona" required className="w-full px-3 py-2 bg-surface-fill rounded-8 text-sm border border-surface-border focus:border-accent-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-surface-hover rounded-8 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-semibold rounded-8 shadow-btn hover:shadow-card-lg transition-all">Crear Cobrador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssign && (
        <AssignLoansModal
          collector={showAssign}
          onClose={() => setShowAssign(null)}
          onAssigned={() => { setShowAssign(null); loadCollectors(); }}
        />
      )}

      {showQRManage && (
        <QRManagementModal
          collector={showQRManage}
          onClose={() => setShowQRManage(null)}
        />
      )}
    </div>
  );
}
