// Nominal annual rate, fixed installment, interest on outstanding balance.
export function calculatePayment(principal, annualRate, months, frequency) {
  const periods = { mensual: 12, quincenal: 24, semanal: 52 }[frequency];
  if (!periods || !Number.isFinite(principal) || principal <= 0 || principal > 1e9 || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100 || !Number.isFinite(months) || months < 1 || months > 360) return null;
  const count = Math.max(1, Math.round(months * periods / 12));
  const rate = annualRate / 100 / periods;
  const payment = rate === 0 ? principal / count : principal * rate / -Math.expm1(-count * Math.log1p(rate));
  return { payment, count, total: payment * count, interest: payment * count - principal };
}
