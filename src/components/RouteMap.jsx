import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink, Loader2, MapPin, Navigation, Route, SearchX } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const SANTO_DOMINGO = [18.4861, -69.9312];
const fmt = (n) => `RD$${Number(n || 0).toLocaleString('es-DO')}`;

const markerIcon = (index, active = false) => L.divIcon({
  className: '',
  html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:3px solid #fff;border-radius:999px;background:${active ? '#ffb547' : '#071b2e'};box-shadow:0 6px 16px rgba(7,27,46,.26);color:${active ? '#071b2e' : '#fff'};font:800 13px 'DM Sans',sans-serif">${index + 1}</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -19],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function addressOf(item) {
  return [item.clienteDireccion, item.clienteSector, item.clienteCiudad, item.clienteProvincia]
    .filter(Boolean).join(', ');
}

function getCached(address) {
  try { return JSON.parse(sessionStorage.getItem(`bonexa.geo.${address}`) || 'null'); } catch { return null; }
}

export default function RouteMap({ assignments = [], liveSessions = [], title = 'Mapa de ruta', subtitle = 'Ordena tus paradas y navega hasta cada cliente.' }) {
  const [selectedId, setSelectedId] = useState(null);
  const [locations, setLocations] = useState({});
  const [geocoding, setGeocoding] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = {};
      for (const item of assignments) {
        const live = liveSessions.find((session) => String(session.loanId) === String(item.loanId) && session.latitude != null && session.longitude != null);
        const address = addressOf(item);
        if (live) { next[item.id] = [Number(live.latitude), Number(live.longitude)]; continue; }
        if (!address) continue;
        const cached = getCached(address);
        if (cached) { next[item.id] = cached; continue; }
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=do&q=${encodeURIComponent(`${address}, República Dominicana`)}`, { headers: { Accept: 'application/json' } });
          const [result] = await response.json();
          if (result) {
            const point = [Number(result.lat), Number(result.lon)];
            next[item.id] = point;
            sessionStorage.setItem(`bonexa.geo.${address}`, JSON.stringify(point));
          }
        } catch { /* An address can remain without coordinates until the next refresh. */ }
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      if (active) { setLocations(next); setGeocoding(false); }
    };
    setGeocoding(true); load();
    return () => { active = false; };
  }, [assignments, liveSessions]);

  const mapped = useMemo(() => assignments.map((item) => ({ ...item, point: locations[item.id], address: addressOf(item) })).filter((item) => item.point), [assignments, locations]);
  const points = mapped.map((item) => item.point);
  const selected = assignments.find((item) => String(item.id) === String(selectedId));

  const navigateTo = (item) => {
    const query = item.point ? `${item.point[0]},${item.point[1]}` : addressOf(item);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`, '_blank', 'noopener,noreferrer');
  };

  return <section className="financial-card overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border p-5 sm:p-6">
      <div>
        <div className="flex items-center gap-2 text-accent-600"><Route size={16} /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Ruta visual</span></div>
        <h2 className="mt-1 font-display text-xl font-extrabold text-navy-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-bold text-navy-700">{mapped.length} de {assignments.length} ubicadas</div>
    </div>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative min-h-[420px] bg-[#e7eef2] sm:min-h-[520px]">
        <MapContainer center={SANTO_DOMINGO} zoom={12} scrollWheelZoom className="z-0 h-full min-h-[420px] w-full sm:min-h-[520px]">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds points={points} />
          {points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#d88718', weight: 4, opacity: .82, dashArray: '10 8' }} />}
          {mapped.map((item, index) => <Marker key={item.id} position={item.point} icon={markerIcon(index, String(item.id) === String(selectedId))} eventHandlers={{ click: () => setSelectedId(item.id) }}>
            <Popup><div className="min-w-[190px]"><strong>{index + 1}. {item.clienteNombre}</strong><p className="mt-1 text-xs">{item.address || 'Dirección no registrada'}</p><button type="button" onClick={() => navigateTo(item)} className="mt-2 font-bold text-accent-700">Navegar hasta aquí</button></div></Popup>
          </Marker>)}
        </MapContainer>
        {geocoding && <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-navy-700 shadow-card"><Loader2 size={14} className="animate-spin text-accent-600" />Ubicando paradas...</div>}
        {!geocoding && !mapped.length && <div className="absolute inset-0 z-10 flex items-center justify-center p-6"><div className="rounded-16 bg-white/95 p-6 text-center shadow-card"><SearchX className="mx-auto mb-2 text-slate-400" size={28} /><p className="font-bold text-navy-800">No hay direcciones ubicables</p><p className="mt-1 max-w-xs text-xs text-slate-500">Completa la dirección del cliente para incluirlo en el mapa.</p></div></div>}
      </div>
      <aside className="border-t border-surface-border bg-white lg:border-l lg:border-t-0">
        <div className="border-b border-surface-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Paradas de la ruta</p><p className="mt-1 text-xs text-slate-500">Selecciona una parada para resaltarla.</p></div>
        <div className="max-h-[520px] overflow-y-auto p-3">
          {assignments.map((item, index) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-start gap-3 rounded-12 p-3 text-left transition ${String(item.id) === String(selectedId) ? 'bg-accent-50 ring-1 ring-accent-200' : 'hover:bg-surface-canvas'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${String(item.id) === String(selectedId) ? 'bg-accent-500 text-navy-900' : 'bg-navy-900 text-white'}`}>{index + 1}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-navy-800">{item.clienteNombre || 'Cliente'}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{addressOf(item) || 'Sin dirección registrada'}</span><span className="mt-1 block text-xs font-semibold text-accent-700">Saldo {fmt(item.saldoPendiente)}</span></span>
            {locations[item.id] && <MapPin size={15} className="mt-1 shrink-0 text-success-600" />}
          </button>)}
          {!assignments.length && <p className="p-6 text-center text-sm text-slate-400">No hay clientes asignados.</p>}
        </div>
        {selected && <div className="border-t border-surface-border p-4"><button type="button" onClick={() => navigateTo(selected)} className="flex w-full items-center justify-center gap-2 rounded-8 bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-3 text-sm font-bold text-navy-900 shadow-btn"><Navigation size={16} />Navegar a {selected.clienteNombre?.split(' ')[0] || 'cliente'} <ExternalLink size={14} /></button></div>}
      </aside>
    </div>
  </section>;
}
