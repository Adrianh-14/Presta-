function calculatePaymentDate(fechaInicio, paymentNumber, frecuencia) {
  const fecha = new Date(fechaInicio);
  switch (frecuencia) {
    case 'mensual':
    case 3:
      fecha.setMonth(fecha.getMonth() + paymentNumber);
      break;
    case 'quincenal':
    case 2:
      fecha.setDate(fecha.getDate() + paymentNumber * 15);
      break;
    case 'semanal':
    case 1:
      fecha.setDate(fecha.getDate() + paymentNumber * 7);
      break;
    case 'diaria':
    case 0:
      fecha.setDate(fecha.getDate() + paymentNumber);
      break;
    default:
      fecha.setMonth(fecha.getMonth() + paymentNumber);
  }
  return fecha.toISOString().split('T')[0];
}

export function generateAmortizationTable(principal, annualRate, months, frecuencia = 'mensual', fechaInicio = null) {
  const monthlyRate = annualRate / 100 / 12;
  const table = [];
  const startDate = fechaInicio || new Date().toISOString().split('T')[0];

  if (monthlyRate <= 0) {
    const payment = principal / months;
    for (let i = 1; i <= months; i++) {
      table.push({
        numero: i,
        fechaPago: calculatePaymentDate(startDate, i, frecuencia),
        cuota: Math.round(payment * 100) / 100,
        capital: Math.round(payment * 100) / 100,
        interes: 0,
        saldoInicial: Math.round((principal - payment * (i - 1)) * 100) / 100,
        saldoFinal: Math.round((principal - payment * i) * 100) / 100,
      });
    }
    return table;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  const cuotaFija = principal * (monthlyRate * factor) / (factor - 1);
  let saldo = principal;

  for (let i = 1; i <= months; i++) {
    const saldoInicial = saldo;
    const interesMes = saldo * monthlyRate;
    const capitalMes = cuotaFija - interesMes;
    saldo = saldo - capitalMes;

    table.push({
      numero: i,
      fechaPago: calculatePaymentDate(startDate, i, frecuencia),
      cuota: Math.round(cuotaFija * 100) / 100,
      capital: Math.round(capitalMes * 100) / 100,
      interes: Math.round(interesMes * 100) / 100,
      saldoInicial: Math.round(saldoInicial * 100) / 100,
      saldoFinal: Math.max(0, Math.round(saldo * 100) / 100),
    });
  }

  return table;
}

export function calculateLoanSummary(principal, annualRate, months, paidMonths = 0, saldoPendiente = null, frecuencia = 'mensual', fechaInicio = null) {
  const table = generateAmortizationTable(principal, annualRate, months, frecuencia, fechaInicio);
  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const cuotaFija = principal * (monthlyRate * factor) / (factor - 1);

  const totalCapital = principal;
  const totalIntereses = (cuotaFija * months) - principal;
  const totalPagar = cuotaFija * months;

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
    porcentajePagado: months > 0 ? Math.round((paidMonths / months) * 100) : 0,
    mesesRestantes: months - paidMonths,
    ultimoPago,
    proximoPago,
  };
}
