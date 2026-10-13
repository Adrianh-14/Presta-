import { useEffect, useState } from 'react';
import { Loader2, MapPinned } from 'lucide-react';
import RouteMapView from '../../components/RouteMap';
import { cobradorService } from '../../services/cobradorService';

export default function CollectorRoutes() {
  const [collectors, setCollectors] = useState([]);
  const [selected, setSelected] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { cobradorService.getAll().then(setCollectors).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!collectors.length) return;
    const visible = selected === 'all' ? collectors : collectors.filter((item) => String(item.id) === String(selected));
    Promise.all(visible.map(async (collector) => (await cobradorService.getAssignments(collector.id)).map((item) => ({ ...item, collectorNombre: collector.nombre }))))
      .then((groups) => setAssignments(groups.flat()))
      .catch(() => setAssignments([]));
  }, [collectors, selected]);
  if (loading) return <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-400"><Loader2 size={17} className="animate-spin" />Cargando rutas...</div>;
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-accent-600"><MapPinned size={18} /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Operación en campo</span></div><h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Rutas de cobradores</h1><p className="mt-1 text-sm text-slate-500">Visualiza las asignaciones y abre la ruta de cada cobrador.</p></div><select value={selected} onChange={(event) => setSelected(event.target.value)} className="rounded-8 border border-surface-border bg-white px-3 py-2.5 text-sm font-semibold text-navy-800"><option value="all">Todos los cobradores</option>{collectors.map((collector) => <option key={collector.id} value={collector.id}>{collector.nombre}</option>)}</select></header><RouteMapView assignments={assignments} title={selected === 'all' ? 'Todas las rutas asignadas' : `Ruta de ${collectors.find((item) => String(item.id) === String(selected))?.nombre || 'cobrador'}`} subtitle="Cada marcador representa un cliente asignado. Las rutas respetan la privacidad del cliente y usan su dirección registrada." /></div>;
}
