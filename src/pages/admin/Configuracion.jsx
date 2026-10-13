import { useEffect, useState } from 'react';
import { Coins, Save } from 'lucide-react';
import api from '../../services/api';
import { CURRENCY_CATALOG } from '../../data/currencies';
import CurrencyFlag from '../../components/CurrencyFlag';

export default function Configuracion() {
  const [config, setConfig] = useState(null);
  const [selected, setSelected] = useState([]);
  const [original, setOriginal] = useState([]);
  const [capital, setCapital] = useState({});
  const [profileMonths, setProfileMonths] = useState(6);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/tenant/config').then(({ data }) => {
      const currencies = data.monedasHabilitadas || ['DOP'];
      setConfig(data);
      setSelected(currencies);
      setOriginal(currencies);
      setCapital(data.capitalInicialPorMoneda || {});
      setProfileMonths(data.clientProfileRefreshMonths || 6);
    }).catch(() => setMessage('No se pudo cargar la configuración.'));
  }, []);

  const toggle = (code) => setSelected((current) => current.includes(code)
    ? (code === 'DOP' ? current : current.filter((item) => item !== code))
    : [...current, code]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    const added = selected.filter((code) => !original.includes(code));
    const missing = added.find((code) => capital[code] === undefined || capital[code] === '' || Number(capital[code]) < 0);
    if (missing) {
      setMessage(`Indica el capital inicial de ${missing}.`);
      setSaving(false);
      return;
    }
    try {
      const { data } = await api.put('/api/tenant/config', {
        nombre: config.nombre,
        logoUrl: config.logoUrl,
        email: config.email,
        telefono: config.telefono,
        monedasHabilitadas: selected,
        capitalInicialPorMoneda: Object.fromEntries(selected.map((code) => [code, Number(capital[code] || 0)])),
        clientProfileRefreshMonths: Number(profileMonths),
      });
      setConfig(data);
      setSelected(data.monedasHabilitadas || selected);
      setOriginal(data.monedasHabilitadas || selected);
      setCapital(data.capitalInicialPorMoneda || capital);
      setProfileMonths(data.clientProfileRefreshMonths || profileMonths);
      setMessage('Configuración guardada correctamente.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const addedCurrencies = CURRENCY_CATALOG.filter(({ code }) => selected.includes(code) && !original.includes(code));
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-600">Configuración operativa</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-navy-800">Divisas y perfil de clientes</h1>
        <p className="text-sm text-slate-500">Define cada cuánto tu financiera solicita confirmar los datos de sus clientes.</p>
      </div>
      <section className="mb-5 max-w-4xl rounded-12 border border-surface-border bg-white p-6 shadow-card">
        <h2 className="font-bold text-navy-500">Frecuencia de actualización del perfil</h2>
        <p className="mt-1 text-sm text-slate-400">Al vencer el plazo, el cliente actualizará sus datos antes de consultar préstamos o pedir otro. Podrá pagar obligaciones existentes.</p>
        <label className="mt-5 block max-w-sm text-sm font-semibold text-navy-700">
          Solicitar actualización cada
          <select value={profileMonths} onChange={(event) => setProfileMonths(event.target.value)} className="auth-input mt-2">
            {[3, 6, 12, 18, 24].map((months) => <option key={months} value={months}>{months} meses</option>)}
          </select>
        </label>
      </section>
      <section className="max-w-4xl rounded-12 border border-surface-border bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="rounded-8 bg-accent-50 p-2 text-accent-600"><Coins size={20} /></div>
          <div><h2 className="font-bold text-navy-500">Monedas habilitadas</h2><p className="text-sm text-slate-400">Activa una nueva divisa para agregarla a tu operación.</p></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CURRENCY_CATALOG.map((currency) => {
            const checked = selected.includes(currency.code);
            return <label key={currency.code} className={`flex cursor-pointer items-center gap-3 rounded-8 border p-4 ${checked ? 'border-accent-300 bg-accent-50/50' : 'border-surface-border'}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(currency.code)} className="h-4 w-4" />
              <CurrencyFlag currency={currency} className="h-5 w-8" />
              <span><b className="text-sm text-navy-500">{currency.code}</b><span className="block text-xs text-slate-400">{currency.name}</span></span>
            </label>;
          })}
        </div>
        {addedCurrencies.length > 0 && <div className="mt-6 rounded-10 border border-accent-100 bg-accent-50/30 p-4">
          <p className="text-sm font-semibold text-navy-700">Capital inicial de la nueva divisa</p>
          <p className="mt-1 text-xs text-slate-500">Indica el monto de cada moneda que acabas de agregar.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{addedCurrencies.map((currency) => <label key={currency.code} className="text-xs font-semibold text-navy-700">
            <span className="mr-1 inline-flex align-middle"><CurrencyFlag currency={currency} className="h-4 w-6" /></span>{currency.name} ({currency.code})
            <input required type="number" min="0" step="0.01" value={capital[currency.code] ?? ''} onChange={(event) => setCapital((current) => ({ ...current, [currency.code]: event.target.value }))} className="auth-input mt-1 font-mono" placeholder="Indica el monto" />
          </label>)}</div>
        </div>}
        {message && <p className="mt-4 text-sm text-accent-700" role="status">{message}</p>}
        <button type="button" disabled={saving || !selected.length || !config} onClick={save} className="mt-6 flex items-center gap-2 rounded-8 bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save size={16} />{saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </section>
    </div>
  );
}
