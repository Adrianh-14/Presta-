import { jsPDF } from 'jspdf';

const money = (value, currency = 'DOP') => new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency,
  minimumFractionDigits: 2,
}).format(Number(value || 0));

const dateLabel = (value) => value
  ? new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

export function downloadPaymentReceipt(receipt, { audience = 'Cliente' } = {}) {
  const currency = receipt?.moneda || 'DOP';
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const width = 148;
  let y = 20;

  doc.setFillColor(7, 27, 46);
  doc.rect(0, 0, width, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Bonexa', 16, 18);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', 16, 27);
  doc.text(audience.toUpperCase(), 132, 27, { align: 'right' });

  y = 49;
  doc.setTextColor(7, 27, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Pago confirmado', 16, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(76, 95, 117);
  doc.text(`Fecha: ${dateLabel(receipt?.fechaPago)}`, 16, y);
  y += 6;
  doc.text(`Referencia: ${receipt?.paymentId || receipt?.referencia || '-'}`, 16, y);
  y += 12;

  doc.setFillColor(245, 248, 251);
  doc.roundedRect(12, y - 6, width - 24, 25, 4, 4, 'F');
  doc.setTextColor(7, 27, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Cliente', 18, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt?.clienteNombre || '-', 18, y + 9);
  doc.text(`Préstamo: ${receipt?.prestamoId || '-'}`, 18, y + 15);
  y += 37;

  const rows = [
    ['Capital aplicado', money(receipt?.capital, currency)],
    ['Interés aplicado', money(receipt?.interes, currency)],
    ['Mora aplicada', money(receipt?.mora, currency)],
  ];
  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setTextColor(76, 95, 117);
    doc.text(label, 18, y);
    doc.setTextColor(7, 27, 46);
    doc.text(value, 130, y, { align: 'right' });
    y += 8;
  });

  doc.setDrawColor(218, 226, 235);
  doc.line(18, y, 130, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(7, 27, 46);
  doc.text('Total pagado', 18, y);
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(14);
  doc.text(money(receipt?.monto, currency), 130, y, { align: 'right' });
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(76, 95, 117);
  doc.text('Saldo restante', 18, y);
  doc.setTextColor(7, 27, 46);
  doc.text(money(receipt?.saldoRestante, currency), 130, y, { align: 'right' });
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(125, 141, 158);
  doc.text('Comprobante generado por Bonexa. Conserva este documento.', 74, y, { align: 'center' });

  const fileName = `bonexa-recibo-${String(receipt?.paymentId || 'pago').slice(0, 12)}.pdf`;
  doc.save(fileName);
}

export function printPaymentReceipt(receipt) {
  const currency = receipt?.moneda || 'DOP';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recibo Bonexa</title><style>body{font-family:Arial,sans-serif;color:#071b2e;padding:32px;max-width:560px;margin:auto}header{background:#071b2e;color:#fff;padding:18px;border-radius:12px}h1{font-size:22px;margin:0 0 6px}p{color:#4c5f75}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #dae2eb}.total{font-size:18px;font-weight:700;border-bottom:0}</style></head><body><header><h1>Bonexa</h1><div>RECIBO DE PAGO</div></header><h2>Pago confirmado</h2><p>Cliente: ${receipt?.clienteNombre || '-'}</p><p>Fecha: ${dateLabel(receipt?.fechaPago)}</p><div class="row"><span>Capital aplicado</span><b>${money(receipt?.capital, currency)}</b></div><div class="row"><span>Interés aplicado</span><b>${money(receipt?.interes, currency)}</b></div><div class="row"><span>Mora aplicada</span><b>${money(receipt?.mora, currency)}</b></div><div class="row total"><span>Total pagado</span><b>${money(receipt?.monto, currency)}</b></div><div class="row"><span>Saldo restante</span><b>${money(receipt?.saldoRestante, currency)}</b></div><script>window.onload=()=>window.print();</script></body></html>`;
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=640,height=760');
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
}
