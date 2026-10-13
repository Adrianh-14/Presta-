import { useEffect, useState } from 'react';
import { MapPinned } from 'lucide-react';
import RouteMapView from '../../components/RouteMap';
import { collectorPortalService } from '../../services/cobradorService';

export default function CollectorRouteMap() {
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([collectorPortalService.getCollections(), collectorPortalService.getMyLocationSessions()])
      .then(([items, activeSessions]) => { setAssignments(items); setSessions(activeSessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Cargando mapa de ruta...</div>;
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-accent-600"><MapPinned size={18} /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Mi ruta</span></div><h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Mapa de cobranza</h1><p className="mt-1 text-sm text-slate-500">Tus clientes asignados, ordenados para salir a cobrar.</p></header><RouteMapView assignments={assignments} liveSessions={sessions} title="Mis paradas de hoy" subtitle="La línea muestra el orden de tus clientes. Usa Navegar para abrir la ruta en Google Maps." /></div>;
}
