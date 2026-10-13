// Dates from the amortization schedule are calendar dates, not instants.
// Keep the YYYY-MM-DD portion so the browser timezone cannot move them a day.
export function dateOnlyKey(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateOnly(value, locale = 'es-DO') {
  const key = dateOnlyKey(value);
  if (!key) return '-';
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

export const todayDateOnly = () => dateOnlyKey(new Date());
