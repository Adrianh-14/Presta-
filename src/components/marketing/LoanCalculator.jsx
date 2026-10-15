import { useState } from 'react';
import { calculatePayment } from '../../lib/loanCalculator.mjs';

export default function LoanCalculator() {
  const [amount, setAmount] = useState('80000');
  const [rate, setRate] = useState('18');
  const [months, setMonths] = useState('12');
  const [frequency, setFrequency] = useState('mensual');
  const result = amount === '' || rate === '' || months === '' ? null : calculatePayment(Number(amount), Number(rate), Number(months), frequency);
  const money = value => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
  const inputClass = 'mt-2 block w-full rounded-8 border border-surface-border bg-white px-3 py-3 text-navy-900';
  return <section id="simulador" className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
    <div className="grid gap-8 rounded-16 bg-navy-900 p-6 text-white sm:p-10 md:grid-cols-2">
      <div><h2 className="font-display text-3xl font-extrabold">Calculadora de préstamos y cuotas</h2><p className="mt-3 text-slate-300">Simula una cuota fija con interés sobre saldo pendiente.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Monto en RD$<input className={inputClass} type="number" min="1" max="1000000000" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label className="text-sm">Interés nominal anual (%)<input className={inputClass} type="number" min="0" max="100" step="0.01" value={rate} onChange={e => setRate(e.target.value)} /></label>
          <label className="text-sm">Plazo en meses<input className={inputClass} type="number" min="1" max="360" value={months} onChange={e => setMonths(e.target.value)} /></label>
          <label className="text-sm">Frecuencia<select className={inputClass} value={frequency} onChange={e => setFrequency(e.target.value)}><option value="mensual">Mensual</option><option value="quincenal">Quincenal (24 al año)</option><option value="semanal">Semanal (52 al año)</option></select></label>
        </div>
      </div>
      <div className="rounded-12 bg-surface-canvas p-6 text-navy-900" aria-live="polite" aria-atomic="true">
        {result ? <><p>Cuota estimada</p><p className="mt-2 break-words font-display text-4xl font-extrabold">{money(result.payment)}</p><p className="mt-2 text-sm">{result.count} cuotas · frecuencia {frequency}</p><dl className="mt-6 space-y-3"><div className="flex justify-between gap-3"><dt>Total estimado</dt><dd>{money(result.total)}</dd></div><div className="flex justify-between gap-3"><dt>Intereses</dt><dd>{money(result.interest)}</dd></div></dl></> : <p>Introduce un monto mayor que cero, una tasa entre 0 y 100% y un plazo entre 1 y 360 meses.</p>}
        <p className="mt-6 text-xs leading-5 text-slate-600">Ejemplo educativo, sin comisiones, seguros ni mora. La tasa periódica es la anual dividida entre los períodos del año. El calendario real y el redondeo de cada cuota pueden variar.</p>
        <a href="/recursos/tabla-amortizacion-prestamos/" className="mt-4 inline-block text-sm font-bold underline">Entender la tabla de amortización →</a>
      </div>
    </div>
  </section>;
}
