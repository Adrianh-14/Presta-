import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowRight, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { portalService } from '../../services/portalService';
import { formatDateOnly } from '../../utils/dateOnly';

const isPaidLoan = (loan) => loan.estado === 3 || String(loan.estado || '').toLowerCase() === 'pagado';

const money = (amount, currency = 'DOP') => new Intl.NumberFormat('es-DO', {
  style: 'currency', currency: String(currency || 'DOP').toUpperCase(),
}).format(Number(amount || 0));

export default function PortalLoanRecord() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalService.getMyLoans()
      .then((items) => setLoans(items.filter(isPaidLoan)))
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-accent-500" /></div>;

  return (
    <div className="max-w-5xl">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Tu trayectoria</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-navy-800">Récord de préstamos</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500">Aquí aparecen los préstamos que ya liquidaste con esta financiera.</p>

      {loans.length === 0 ? (
        <section className="rounded-16 border border-dashed border-surface-border bg-white px-6 py-14 text-center shadow-card">
          <Archive className="mx-auto mb-4 text-slate-300" size={42} />
          <h2 className="font-bold text-navy-700">Todavía no hay préstamos liquidados</h2>
          <p className="mt-1 text-sm text-slate-500">Cuando termines de pagar uno, quedará guardado aquí.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <button key={loan.id} type="button" onClick={() => navigate(`/portal/prestamo/${loan.id}`)} className="group w-full rounded-16 border border-surface-border bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-12 bg-success-50 text-success-700"><CheckCircle2 size={20} /></span>
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-success-700">Liquidado</span><span className="mt-0.5 block text-xs text-slate-400">Préstamo · {String(loan.moneda || 'DOP').toUpperCase()}</span></span>
                </div>
                <span className="text-xl font-extrabold text-navy-800">{money(loan.monto, loan.moneda)}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><Calendar size={15} /> Inicio {loan.fechaInicio ? formatDateOnly(loan.fechaInicio) : '—'}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-accent-600 group-hover:gap-2.5">Ver documentos y detalle <ArrowRight size={15} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
