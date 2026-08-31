const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const currency = (value) => new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? escapeHtml(value) : parsed.toLocaleDateString('es-DO');
};

export function printAmortization({ client, loan, rows, title = 'Tabla de amortización', companyName }) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    window.alert('Permite las ventanas emergentes para imprimir la tabla.');
    return;
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const clientName = client?.nombre || client?.cliente || loan?.cliente || 'Cliente';
  const hasStatus = safeRows.some((row) => row.estado);
  const tableRows = safeRows.map((row, index) => `
    <tr>
      <td>${escapeHtml(row.numero ?? index + 1)}</td>
      <td>${formatDate(row.fechaPago)}</td>
      <td class="number">${currency(row.capital)}</td>
      <td class="number">${currency(row.interes)}</td>
      <td class="number strong">${currency(row.cuota)}</td>
      <td class="number">${currency(row.saldoFinal)}</td>
      ${hasStatus ? `<td class="center">${escapeHtml(row.estado || 'Pendiente')}</td>` : ''}
    </tr>
  `).join('');

  printWindow.document.write(`<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)} - ${escapeHtml(clientName)}</title>
      <style>
        @page { size: letter landscape; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #122b42; font: 10px Arial, sans-serif; }
        header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 12px; border-bottom: 3px solid #1266d6; }
        .brand { color: #0b3558; font-size: 22px; font-weight: 800; letter-spacing: -.5px; }
        .brand span { color: #1266d6; }
        h1 { margin: 3px 0 0; font-size: 14px; font-weight: 600; }
        .issued { color: #64748b; text-align: right; line-height: 1.5; }
        .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 10px; margin: 14px 0; }
        .panel { border: 1px solid #d9e3ec; border-radius: 7px; padding: 10px 12px; }
        .panel-title { margin-bottom: 8px; color: #1266d6; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 14px; }
        .label { display: block; margin-bottom: 2px; color: #718096; font-size: 8px; text-transform: uppercase; }
        .value { font-weight: 700; overflow-wrap: anywhere; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .summary .value { font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        th { padding: 7px 6px; background: #edf4fb; color: #456987; font-size: 8px; text-transform: uppercase; }
        td { padding: 6px; border-bottom: 1px solid #dce6ee; }
        th:first-child, td:first-child { text-align: left; }
        .number { text-align: right; white-space: nowrap; }
        .center { text-align: center; }
        .strong { color: #0b3558; font-weight: 700; }
        footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #d9e3ec; color: #718096; font-size: 8px; }
        @media screen { body { max-width: 1100px; margin: 24px auto; padding: 20px; box-shadow: 0 8px 32px #0b355826; } }
      </style>
    </head>
    <body>
      <header>
        <div><div class="brand">${escapeHtml(companyName || 'PréstamoPlus')}</div><h1>${escapeHtml(title)}</h1></div>
        <div class="issued">Documento generado<br><strong>${escapeHtml(new Date().toLocaleString('es-DO'))}</strong></div>
      </header>
      <section class="grid">
        <div class="panel">
          <div class="panel-title">Información del cliente</div>
          <div class="details">
            <div><span class="label">Nombre</span><span class="value">${escapeHtml(clientName)}</span></div>
            <div><span class="label">Cédula</span><span class="value">${escapeHtml(client?.cedula || loan?.cedula || '-')}</span></div>
            <div><span class="label">Teléfono</span><span class="value">${escapeHtml(client?.telefono || loan?.telefono || '-')}</span></div>
            <div><span class="label">Correo</span><span class="value">${escapeHtml(client?.email || loan?.email || '-')}</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">Condiciones del préstamo</div>
          <div class="summary">
            <div><span class="label">Monto</span><span class="value">${currency(loan?.monto)}</span></div>
            <div><span class="label">Tasa mensual</span><span class="value">${escapeHtml(loan?.tasa ?? 0)}%</span></div>
            <div><span class="label">Plazo</span><span class="value">${escapeHtml(loan?.plazo ?? '-')} meses</span></div>
            <div><span class="label">Frecuencia</span><span class="value">${escapeHtml(loan?.frecuencia || '-')}</span></div>
            <div><span class="label">Cuota</span><span class="value">${currency(loan?.cuota)}</span></div>
            <div><span class="label">Total a pagar</span><span class="value">${currency(loan?.totalPagar)}</span></div>
          </div>
        </div>
      </section>
      <table>
        <thead><tr><th>#</th><th>Fecha</th><th class="number">Capital</th><th class="number">Interés</th><th class="number">Cuota</th><th class="number">Saldo</th>${hasStatus ? '<th class="center">Estado</th>' : ''}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <footer>Proyección de pagos del préstamo. Los cargos por mora u otros movimientos posteriores pueden modificar los valores mostrados.</footer>
      <script>window.onload = () => { window.focus(); window.print(); };</script>
    </body>
  </html>`);
  printWindow.document.close();
}
