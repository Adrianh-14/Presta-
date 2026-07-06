import { useState, useCallback, useEffect } from 'react';
import { QrCode, User, Calculator, DollarSign, ChevronDown, ChevronUp, Check, AlertTriangle, Search, RefreshCw, UserPlus, ArrowRight } from 'lucide-react';
import { prestamoService } from '../../services/prestamoService';
import { clientService } from '../../services/clientService';
import { generateAmortizationTable } from '../../utils/amortization';

function formatCurrency(v) { return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v); }
function formatNumber(v) { return new Intl.NumberFormat('es-DO').format(Math.round(v)); }
const freqNames = { diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };

export default function NuevoPrestamo() {
  const [step, setStep] = useState('qr'); // qr | select | loan

  // Client
  const [client, setClient] = useState(null);
  const [searchCedula, setSearchCedula] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Loan
  const [monto, setMonto] = useState('50,000');
  const [tasa, setTasa] = useState('2.5');
  const [plazo, setPlazo] = useState('6');
  const [frecuencia, setFrecuencia] = useState('quincenal');
  const [cierre, setCierre] = useState('3');
  const [tipoPrestamo, setTipoPrestamo] = useState(0);

  // Results
  const [results, setResults] = useState(null);
  const [tableVisible, setTableVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  const getAmount = () => parseFloat(monto.replace(/,/g, '')) || 0;
  const periodsPerFreq = { diaria: 30, semanal: 4, quincenal: 2, mensual: 1 };
  const freqMap = { daily: 0, weekly: 1, biweekly: 2, monthly: 3, diaria: 0, semanal: 1, quincenal: 2, mensual: 3 };

  const qrUrl = `${window.location.origin}/solicitud?mode=client`;

  const doCalc = useCallback(() => {
    const amount = getAmount();
    const term = parseInt(plazo) || 0;
    if (amount <= 0 || term <= 0) { setResults(null); return; }

    const principal = amount * (1 + (parseFloat(cierre) || 0) / 100);
    const rateMonth = (parseFloat(tasa) || 0) / 100;
    const pp = periodsPerFreq[frecuencia] || 1;
    const r = rateMonth / pp;
    const n = term * pp;

    if (r <= 0) {
      const cuota = principal / n;
      setResults({ cuota: Math.round(cuota * 100) / 100, totalPaid: principal, totalInterest: 0, periods: n, principal });
      return;
    }
    const f = Math.pow(1 + r, n);
    const cuota = principal * (r * f) / (f - 1);
    setResults({
      cuota: Math.round(cuota * 100) / 100,
      totalPaid: Math.round(cuota * n * 100) / 100,
      totalInterest: Math.round((cuota * n - principal) * 100) / 100,
      periods: n,
      principal: Math.round(principal * 100) / 100,
    });
  }, [monto, cierre, tasa, plazo, frecuencia]);

  useEffect(() => { const t = setTimeout(doCalc, 300); return () => clearTimeout(t); }, [doCalc]);

  const amortTable = results ? generateAmortizationTable(results.principal, parseFloat(tasa) * 12 || 30, parseInt(plazo) || 6, frecuencia, new Date().toISOString().split('T')[0], results.cuota) : [];

  const searchClient = async () => {
    if (!searchCedula.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const clients = await clientService.getAll(searchCedula.trim());
      const found = clients.find(c => c.cedula === searchCedula.trim());
      if (found) {
        setClient(found);
        setStep('loan');
      } else {
        setSearchError('Cliente no encontrado. Pide al cliente que escanee el QR.');
      }
    } catch { setSearchError('Error al buscar'); }
    finally { setSearching(false); }
  };

  const handleCreate = async () => {
    if (!client) { setError('Selecciona un cliente primero'); return; }
    if (!results) { setError('Completa los datos del préstamo'); return; }
    setCreating(true);
    setError('');
    try {
      const data = await prestamoService.createDirect({
        nombre: client.nombre,
        cedula: client.cedula,
        telefono: client.telefono || '',
        email: client.email || '',
        monto: getAmount(),
        tasaMensual: parseFloat(tasa) || 2.5,
        plazo: parseInt(plazo) || 6,
        frecuenciaPago: freqMap[frecuencia] ?? 2,
        gastoCierrePorcentaje: parseFloat(cierre) || 3,
        tipoPrestamo,
        tenantId: null,
      });
      setCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el préstamo');
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-16 border border-surface-border shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-success-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-navy-500 mb-2">Préstamo creado</h2>
          <p className="text-slate-400 mb-6">{created.cliente} — ${Number(created.monto || 0).toLocaleString()}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCreated(null); setClient(null); setStep('qr'); }} className="px-6 py-2.5 bg-navy-50 text-navy-500 rounded-8 font-semibold text-sm hover:bg-navy-100 transition-colors">
              Nuevo préstamo
            </button>
            <button onClick={() => window.location.href = '/admin/prestamos'} className="px-6 py-2.5 gradient-accent text-white rounded-8 font-semibold text-sm">
              Ver préstamos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-500 mb-1">Nuevo Préstamo</h1>
      <p className="text-slate-400 text-sm mb-8">El cliente se registra con QR y tú creas el préstamo</p>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { id: 'qr', label: 'QR Registro', icon: QrCode },
          { id: 'select', label: 'Buscar Cliente', icon: Search },
          { id: 'loan', label: 'Crear Préstamo', icon: Calculator },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => { if (i <= ['qr','select','loan'].indexOf(step)) setStep(s.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-8 text-sm font-semibold transition-all ${
                step === s.id ? 'bg-navy-500 text-white shadow-card' :
                ['qr','select','loan'].indexOf(step) > i ? 'bg-navy-50 text-navy-500' :
                'bg-surface-fill text-slate-400'
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
            {i < 2 && <div className="w-8 h-px bg-surface-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: QR */}
      {step === 'qr' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-16 border border-surface-border shadow-card p-8 text-center">
            <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="text-accent-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-navy-500 mb-2">Registro rápido por QR</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
              El cliente escanea este código, llena SOLO sus datos personales (sin préstamo). Tú creas el préstamo después desde este panel.
            </p>

            <div className="bg-white inline-block p-4 rounded-12 border-2 border-surface-border shadow-card mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0b3558`}
                alt="QR Registro"
                className="w-48 h-48"
              />
            </div>

            <p className="text-xs text-slate-400 mb-6 font-mono bg-surface-canvas inline-block px-3 py-1 rounded-full">
              {qrUrl}
            </p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep('select')} className="px-6 py-3 gradient-accent text-white rounded-8 font-semibold text-sm shadow-btn flex items-center gap-2">
                Ya se registró <ArrowRight size={16} />
              </button>
              <button onClick={() => navigator.clipboard.writeText(qrUrl)} className="px-6 py-3 border-2 border-surface-border rounded-8 font-semibold text-sm text-slate-500 hover:text-navy-500 transition-colors">
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Search */}
      {step === 'select' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-16 border border-surface-border shadow-card p-6">
            <h2 className="text-base font-bold text-navy-500 mb-4 flex items-center gap-2">
              <Search size={18} /> Buscar cliente registrado
            </h2>
            <p className="text-slate-400 text-sm mb-4">Ingresa la cédula del cliente que acaba de registrarse</p>

            <div className="flex gap-3">
              <input
                value={searchCedula}
                onChange={e => setSearchCedula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchClient()}
                className="flex-1 px-4 py-3 border border-surface-border rounded-8 font-mono text-sm focus:ring-2 focus:ring-accent-500 outline-none"
                placeholder="001-1234567-8"
                autoFocus
              />
              <button onClick={searchClient} disabled={searching || !searchCedula.trim()} className="px-6 py-3 gradient-accent text-white rounded-8 font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </div>
            {searchError && (
              <div className="flex items-center gap-2 mt-3 text-danger-500 text-sm bg-danger-50 px-4 py-2 rounded-full">
                <AlertTriangle size={14} /> {searchError}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-surface-border flex justify-between">
              <button onClick={() => setStep('qr')} className="text-sm text-slate-400 hover:text-navy-500 transition-colors">
                ← Volver al QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Loan */}
      {step === 'loan' && (
        <div>
          {/* Client info bar */}
          <div className="bg-white rounded-12 border border-surface-border shadow-card p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center">
                <User className="text-navy-500" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-navy-500">{client?.nombre}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono">{client?.cedula}</span>
                  {client?.telefono && <span>{client?.telefono}</span>}
                  {client?.email && <span>{client?.email}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => { setClient(null); setStep('select'); }} className="text-xs text-slate-400 hover:text-accent-500 transition-colors flex items-center gap-1">
              <RefreshCw size={12} /> Cambiar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-16 border border-surface-border shadow-card p-6">
              <h2 className="text-base font-bold text-navy-500 mb-4 flex items-center gap-2">
                <Calculator size={18} /> Calculadora
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto (RD$)</label>
                  <input value={monto} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMonto(v ? formatNumber(parseInt(v)) : '0'); }} className="w-full mt-1 px-3 py-2.5 border border-surface-border rounded-4 text-lg font-bold focus:ring-2 focus:ring-accent-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa mensual (%)</label>
                    <input type="number" step="0.1" value={tasa} onChange={e => setTasa(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-surface-border rounded-4 text-sm focus:ring-2 focus:ring-accent-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plazo (meses)</label>
                    <select value={plazo} onChange={e => setPlazo(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-surface-border rounded-4 text-sm focus:ring-2 focus:ring-accent-500 outline-none bg-white">
                      {[1,2,3,4,6,8,12,18,24,36,48].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frecuencia</label>
                    <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)} className="w-full mt-1 px-2 py-2.5 border border-surface-border rounded-4 text-sm focus:ring-2 focus:ring-accent-500 outline-none bg-white">
                      {Object.entries(freqNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cierre (%)</label>
                    <input type="number" step="0.5" value={cierre} onChange={e => setCierre(e.target.value)} className="w-full mt-1 px-2 py-2.5 border border-surface-border rounded-4 text-sm focus:ring-2 focus:ring-accent-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</label>
                    <select value={tipoPrestamo} onChange={e => setTipoPrestamo(parseInt(e.target.value))} className="w-full mt-1 px-2 py-2.5 border border-surface-border rounded-4 text-sm focus:ring-2 focus:ring-accent-500 outline-none bg-white">
                      <option value={0}>Personal</option>
                      <option value={1}>Garantía</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-16 border border-surface-border shadow-card p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center mb-3">
                <Check className="text-success-500" size={24} />
              </div>
              <p className="text-navy-500 font-bold text-sm mb-1">Cliente verificado</p>
              <p className="text-slate-400 text-xs">{client?.nombre} está listo. Configura el préstamo y crea.</p>
            </div>
          </div>

          {results && (
            <div className="mt-8">
              <div className="gradient-hero rounded-16 p-8 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Cuota {freqNames[frecuencia]}</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.cuota)}</p>
                    <p className="text-navy-300 text-xs mt-1">{(results.periods || 0)} pagos</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Total a pagar</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Total intereses</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-navy-200 text-xs font-medium uppercase tracking-wider mb-1">Principal</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.principal)}</p>
                    <p className="text-navy-300 text-xs mt-1">Incluye {cierre}% cierre</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-8 border border-surface-border overflow-hidden h-8 flex text-xs font-semibold">
                <div className="bg-accent-500 text-white flex items-center justify-center transition-all" style={{ width: `${results.totalPaid > 0 ? (results.principal / results.totalPaid * 100) : 50}%` }}>
                  {results.principal / results.totalPaid > 0.2 ? 'Capital' : ''}
                </div>
                <div className="bg-warning-500 text-white flex items-center justify-center transition-all" style={{ width: `${results.totalPaid > 0 ? (results.totalInterest / results.totalPaid * 100) : 50}%` }}>
                  {results.totalInterest / results.totalPaid > 0.2 ? 'Intereses' : ''}
                </div>
              </div>
              <div className="flex gap-6 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-accent-500" /> Capital {(results.principal / results.totalPaid * 100).toFixed(1)}%</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-warning-500" /> Intereses {(results.totalInterest / results.totalPaid * 100).toFixed(1)}%</span>
              </div>

              <button onClick={() => setTableVisible(!tableVisible)} className="mt-6 flex items-center gap-2 text-accent-500 text-sm font-semibold hover:text-accent-600 transition-colors">
                {tableVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {tableVisible ? 'Ocultar tabla de amortización' : 'Ver tabla de amortización'}
              </button>

              {tableVisible && (
                <div className="mt-4 bg-white rounded-12 border border-surface-border shadow-card overflow-hidden">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface-canvas">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase">#</th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase">Fecha</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Capital</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Interés</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Cuota</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {amortTable.map((row, i) => (
                          <tr key={i} className="hover:bg-surface-hover">
                            <td className="px-3 py-2 text-xs font-medium text-navy-500">{row.numero}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{row.fechaPago}</td>
                            <td className="px-3 py-2 text-right text-xs text-success-600">{formatCurrency(row.capital)}</td>
                            <td className="px-3 py-2 text-right text-xs text-warning-600">{formatCurrency(row.interes)}</td>
                            <td className="px-3 py-2 text-right text-xs font-semibold">{formatCurrency(row.cuota)}</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-500">{formatCurrency(row.saldoFinal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="mt-8 flex flex-col items-center gap-4">
              {error && (
                <div className="flex items-center gap-2 text-danger-500 text-sm bg-danger-50 px-4 py-2 rounded-full">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <button onClick={handleCreate} disabled={creating} className="px-8 py-3 gradient-accent text-white rounded-8 font-semibold text-sm shadow-btn hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                <DollarSign size={18} />
                {creating ? 'Creando...' : `Crear préstamo de ${formatCurrency(results.cuota)}/${freqNames[frecuencia].toLowerCase()}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
