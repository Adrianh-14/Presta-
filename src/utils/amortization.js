function normalizeFrecuencia(frecuencia) {
  if (typeof frecuencia === 'number') return frecuencia;
  const normalized = (frecuencia || '').toLowerCase();
  const map = { diaria: 0, semanal: 1, quincenal: 2, mensual: 3 };
  return map[normalized] ?? 3;
}

function calculatePaymentDate(fechaInicio, paymentNumber, frecuencia) {
  const freq = normalizeFrecuencia(frecuencia);
  const fecha = new Date(fechaInicio);
  switch (freq) {
    case 0:
      fecha.setDate(fecha.getDate() + paymentNumber);
      break;
    case 1:
      fecha.setDate(fecha.getDate() + paymentNumber * 7);
      break;
    case 2:
      fecha.setDate(fecha.getDate() + paymentNumber * 15);
      break;
    default:
      fecha.setMonth(fecha.getMonth() + paymentNumber);
  }
  return fecha.toISOString().split('T')[0];
}

function getPeriodsPerMonth(frecuencia) {
  const freq = normalizeFrecuencia(frecuencia);
  switch (freq) {
    case 0: return 30;
    case 1: return 4;
    case 2: return 2;
    default: return 1;
  }
}

export function generateAmortizationTable(principal, annualRate, months, frecuencia = 'mensual', fechaInicio = null, cuotaMensual = null) {
  const periodsPerMonth = getPeriodsPerMonth(frecuencia);
  const totalPeriods = months * periodsPerMonth;
  const monthlyRate = annualRate / 100 / 12;
  const ratePerPeriod = monthlyRate / periodsPerMonth;
  const table = [];
  const startDate = fechaInicio || new Date().toISOString().split('T')[0];

  const cuotaPorPeriodo = cuotaMensual || null;

  if (!cuotaPorPeriodo || ratePerPeriod <= 0) {
    const payment = principal / totalPeriods;
    for (let i = 1; i <= totalPeriods; i++) {
      table.push({
        numero: i,
        fechaPago: calculatePaymentDate(startDate, i, frecuencia),
        cuota: Math.round(payment * 100) / 100,
        capital: Math.round(payment * 100) / 100,
        interes: 0,
        saldoInicial: Math.round((principal - payment * (i - 1)) * 100) / 100,
        saldoFinal: Math.max(0, Math.round((principal - payment * i) * 100) / 100),
      });
    }
    return table;
  }

  let saldo = principal;

  for (let i = 1; i <= totalPeriods; i++) {
    const saldoInicial = saldo;
    const interes = Math.round(saldo * ratePerPeriod * 100) / 100;
    const capital = Math.round((cuotaPorPeriodo - interes) * 100) / 100;
    saldo = Math.max(0, saldo - capital);

    table.push({
      numero: i,
      fechaPago: calculatePaymentDate(startDate, i, frecuencia),
      cuota: Math.round(cuotaPorPeriodo * 100) / 100,
      capital: capital,
      interes: interes,
      saldoInicial: Math.round(saldoInicial * 100) / 100,
      saldoFinal: Math.max(0, Math.round(saldo * 100) / 100),
    });
  }

  return table;
}

export function calculateLoanSummary(principal, annualRate, months, paidMonths = 0, saldoPendiente = null, frecuencia = 'mensual', fechaInicio = null, cuotaMensual = null) {
  const table = generateAmortizationTable(principal, annualRate, months, frecuencia, fechaInicio, cuotaMensual);
  const periodsPerMonth = getPeriodsPerMonth(frecuencia);
  const totalPeriods = months * periodsPerMonth;

  const cuotaFija = cuotaMensual || (table.length > 0 ? table[0].cuota : 0);
  const totalCapital = principal;
  const totalIntereses = (table.reduce((sum, r) => sum + r.cuota, 0)) - principal;
  const totalPagar = table.reduce((sum, r) => sum + r.cuota, 0);

  const pagado = table.slice(0, paidMonths);
  const capitalPagado = pagado.reduce((sum, r) => sum + r.capital, 0);
  const interesPagado = pagado.reduce((sum, r) => sum + r.interes, 0);
  const totalPagado = capitalPagado + interesPagado;

  const ultimoPago = pagado.length > 0 ? pagado[pagado.length - 1] : null;
  const proximoPago = table.length > paidMonths ? table[paidMonths] : null;

  return {
    tabla: table,
    cuotaFija: Math.round(cuotaFija * 100) / 100,
    totalCapital,
    totalIntereses: Math.round(totalIntereses * 100) / 100,
    totalPagar: Math.round(totalPagar * 100) / 100,
    capitalPagado: Math.round(capitalPagado * 100) / 100,
    interesPagado: Math.round(interesPagado * 100) / 100,
    totalPagado: Math.round(totalPagado * 100) / 100,
    saldoCapital: saldoPendiente !== null ? saldoPendiente : Math.round((principal - capitalPagado) * 100) / 100,
    porcentajePagado: totalPeriods > 0 ? Math.round((paidMonths / totalPeriods) * 100) : 0,
    mesesRestantes: totalPeriods - paidMonths,
    ultimoPago,
    proximoPago,
  };
}
