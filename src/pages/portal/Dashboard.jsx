import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowRight, Banknote, Calendar, CheckCircle2, CreditCard, Loader2, Plus, X } from 'lucide-react';
import { portalService } from '../../services/portalService';
import { tenantService } from '../../services/tenantService';
import { CURRENCY_CATALOG, formatCurrency } from '../../data/currencies';
import StatusBadge from '../../components/StatusBadge';
import { formatDateOnly } from '../../utils/dateOnly';

const freqLabels = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', diaria: 'Diaria', Mensual: 'Mensual', Quincenal: 'Quincenal', Semanal: 'Semanal', Diaria: 'Diaria', 0: 'Diaria', 1: 'Semanal', 2: 'Quincenal', 3: 'Mensual' };
const stateName = (value) => String(value ?? '').toLowerCase().replace(/[\s_-]/g, '');
const isPaidLoan = (loan) => loan.estado === 3 || stateName(loan.estado) === 'pagado';
const isClosedLoan = (loan) => isPaidLoan(loan) || loan.estado === 4 || stateName(loan.estado) === 'cancelado';
const isOpenApplication = (application) => [0, 1, 5, 6].includes(application.estado) || ['pendiente', 'procesando', 'contraoferta', 'clienteaprobada'].includes(stateName(application.estado));

export default function PortalDashboard() {
  const [loans, setLoans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [currencies, setCurrencies] = useState(CURRENCY_CATALOG.filter((currency) => currency.code === 'DOP'));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('DOP');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const loadPortal = useCallback(async () => {
    setLoading(true);
    try {
      const [myLoans, myApplications, client] = await Promise.all([
        portalService.getMyLoans(),
        portalService.getMyApplications(),
        portalService.getMe(),
      ]);
      setLoans(myLoans);
      setApplications(myApplications);
      if (client?.tenantId) {
        const codes = await tenantService.getCurrencies(client.tenantId);
        const enabled = CURRENCY_CATALOG.filter((item) => codes.includes(item.code));
        if (enabled.length) {
          setCurrencies(enabled);
          const preferred = myLoans.find(isPaidLoan)?.moneda || enabled[0].code;
          setCurrency(enabled.some((item) => item.code === preferred) ? preferred : enabled[0].code);
        }
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'No pudimos cargar tu información. Actualiza la página para intentarlo otra vez.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  const activeLoans = useMemo(() => loans.filter((loan) => !isClosedLoan(loan)), [loans]);
  const settledLoans = useMemo(() => loans.filter(isPaidLoan), [loans]);
  const pendingApplication = applications.find(isOpenApplication);
  const canRequestAnother = settledLoans.length > 0 && loans.every(isClosedLoan) && !pendingApplication;

  const submitRequest = async (event) => {
    event.preventDefault();
    const requestedAmount = Number(String(amount).replace(/,/g, '.'));
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setError('Escribe un monto mayor que cero.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await portalService.requestAnotherLoan({ montoSolicitado: requestedAmount, moneda: currency });
      setShowRequest(false);
      setAmount('');
      setNotice('Recibimos tu solicitud. La financiera revisará el monto y te enviará su respuesta.');
      await loadPortal();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos enviar tu solicitud. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-accent-500" /></div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Portal de cliente</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Préstamos vigentes</h1>
          <p className="mt-1 text-sm text-slate-500">Aquí ves únicamente los préstamos que todavía estás pagando.</p>
        </div>
        {canRequestAnother && (
          <button type="button" onClick={() => { setError(''); setShowRequest(true); }} className="inline-flex items-center gap-2 rounded-10 bg-warning-500 px-5 py-3 text-sm font-bold text-navy-900 shadow-btn transition hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-400 focus:ring-offset-2">
            <Plus size={18} strokeWidth={2.5} /> Solicitar otro préstamo
          </button>
        )}
      </div>

      {error && !showRequest && <div role="alert" className="mb-5 rounded-10 border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>}
      {notice && <div role="status" className="mb-5 flex items-start gap-3 rounded-12 border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800"><CheckCircle2 className="mt-0.5 shrink-0" size={18} />{notice}</div>}

      {pendingApplication && (
        <section className="mb-6 flex items-start gap-3 rounded-12 border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          <Loader2 size={18} className="mt-0.5 shrink-0" />
          <div><p className="font-bold">Tu solicitud está en revisión</p><p className="mt-0.5">La financiera te notificará cuando tenga una respuesta. Mientras tanto, no necesitas volver a llenar tus datos personales.</p></div>
        </section>
      )}

      {activeLoans.length === 0 ? (
        <section className="rounded-16 border border-surface-border bg-white px-6 py-12 text-center shadow-card sm:py-16">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-16 bg-navy-50 text-navy-500"><CreditCard size={25} /></span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-navy-800">No tienes préstamos pendientes</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Los préstamos que ya liquidaste están guardados aparte para que puedas consultarlos sin confundirlos con una deuda vigente.</p>
          {settledLoans.length > 0 && <button type="button" onClick={() => navigate('/portal/record')} className="mt-5 inline-flex items-center gap-2 font-semibold text-accent-600 hover:text-accent-700">Ver mi récord de préstamos <ArrowRight size={16} /></button>}
          {!canRequestAnother && settledLoans.length === 0 && <p className="mt-5 text-sm text-slate-400">Cuando completes un préstamo, podrás solicitar otro desde aquí.</p>}
        </section>
      ) : (
        <div className="grid gap-5">
          {activeLoans.map((loan) => (
            <button key={loan.id} type="button" onClick={() => navigate(`/portal/prestamo/${loan.id}`)} className="group w-full rounded-16 border border-surface-border bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3"><StatusBadge status={loan.estado} /><span className="text-xs font-medium uppercase tracking-wider text-slate-400">{freqLabels[loan.frecuenciaPago] || ''}</span></div>
                <p className="text-xl font-extrabold text-navy-800 sm:text-2xl">{formatCurrency(loan.monto, loan.moneda)}</p>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <div><p className="mb-1 text-xs text-slate-400">Cuota</p><p className="text-sm font-semibold text-navy-700">{formatCurrency(loan.cuotaMensual, loan.moneda)}</p></div>
                <div><p className="mb-1 text-xs text-slate-400">Saldo pendiente</p><p className="text-sm font-semibold text-navy-700">{formatCurrency(loan.saldoPendiente, loan.moneda)}</p></div>
                <div><p className="mb-1 text-xs text-slate-400">Vencimiento</p><p className="text-sm font-semibold text-navy-700">{loan.fechaVencimiento ? formatDateOnly(loan.fechaVencimiento) : '—'}</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
                <div className="flex items-center gap-5 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Calendar size={14} /> {loan.fechaInicio ? formatDateOnly(loan.fechaInicio) : '—'}</span><span>{loan.plazo} meses</span></div>
                <span className="flex items-center gap-1 text-sm font-semibold text-accent-600 transition-all group-hover:gap-2">Ver detalle <ArrowRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {loans.length > 0 && <button type="button" onClick={() => navigate('/portal/record')} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-accent-600"><Archive size={16} /> Consultar récord de préstamos</button>}

      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setShowRequest(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="repeat-loan-title" className="w-full max-w-md overflow-hidden rounded-16 border border-surface-border bg-white shadow-card-lg">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-12 bg-warning-50 text-warning-700"><Banknote size={20} /></span><div><h2 id="repeat-loan-title" className="font-display text-lg font-extrabold text-navy-800">Nueva solicitud</h2><p className="text-xs text-slate-500">Tus datos de cliente ya están registrados</p></div></div>
              <button type="button" aria-label="Cerrar" disabled={submitting} onClick={() => setShowRequest(false)} className="rounded-8 p-2 text-slate-400 hover:bg-surface-hover hover:text-navy-700"><X size={19} /></button>
            </div>
            <form onSubmit={submitRequest} className="space-y-5 p-5 sm:p-6">
              <div className="rounded-10 border border-navy-100 bg-navy-50/70 p-3 text-sm leading-5 text-navy-700">Solo indícanos cuánto necesitas. La financiera revisará la solicitud y te enviará las condiciones para que las aceptes o respondas.</div>
              {error && <div role="alert" className="rounded-8 border border-danger-200 bg-danger-50 px-3 py-2.5 text-sm text-danger-700">{error}</div>}
              <label className="block text-sm font-semibold text-navy-700">Monto solicitado
                <div className="mt-2 flex gap-2">
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-28 rounded-8 border border-surface-border bg-white px-3 py-3 text-sm font-semibold text-navy-700 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100" aria-label="Moneda">
                    {currencies.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
                  </select>
                  <input type="number" min="0.01" step="0.01" inputMode="decimal" required autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="auth-input min-w-0 flex-1" />
                </div>
              </label>
              <p className="-mt-3 text-xs text-slate-500">Perfil, información de contacto y datos registrados se adjuntan automáticamente.</p>
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-8 bg-warning-500 py-3 font-bold text-navy-900 transition hover:bg-warning-400 disabled:cursor-wait disabled:opacity-60">{submitting ? <><Loader2 size={17} className="animate-spin" /> Enviando solicitud…</> : <><Plus size={18} /> Enviar solicitud</>}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
