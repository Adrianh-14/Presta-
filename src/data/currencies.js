/**
 * Catálogo de divisas soportadas por PréstamoPlus.
 *
 * `flag` es intencionalmente un emoji: funciona sin descargar imágenes,
 * también en móviles, y evita depender de un CDN externo para un selector
 * financiero. El código ISO 4217 es el valor persistido en préstamos y pagos.
 */
export const CURRENCY_CATALOG = [
  { code: 'DOP', country: 'do', flag: '🇩🇴', name: 'Pesos dominicanos', locale: 'es-DO' },
  { code: 'USD', country: 'us', flag: '🇺🇸', name: 'Dólares estadounidenses', locale: 'en-US' },
  { code: 'EUR', country: 'eu', flag: '🇪🇺', name: 'Euros', locale: 'de-DE' },
  { code: 'MXN', country: 'mx', flag: '🇲🇽', name: 'Pesos mexicanos', locale: 'es-MX' },
  { code: 'GTQ', country: 'gt', flag: '🇬🇹', name: 'Quetzales guatemaltecos', locale: 'es-GT' },
  { code: 'HNL', country: 'hn', flag: '🇭🇳', name: 'Lempiras hondureños', locale: 'es-HN' },
  { code: 'NIO', country: 'ni', flag: '🇳🇮', name: 'Córdobas nicaragüenses', locale: 'es-NI' },
  { code: 'CRC', country: 'cr', flag: '🇨🇷', name: 'Colones costarricenses', locale: 'es-CR' },
  { code: 'PAB', country: 'pa', flag: '🇵🇦', name: 'Balboas panameños', locale: 'es-PA' },
  { code: 'COP', country: 'co', flag: '🇨🇴', name: 'Pesos colombianos', locale: 'es-CO' },
  { code: 'PEN', country: 'pe', flag: '🇵🇪', name: 'Soles peruanos', locale: 'es-PE' },
  { code: 'BRL', country: 'br', flag: '🇧🇷', name: 'Reales brasileños', locale: 'pt-BR' },
  { code: 'ARS', country: 'ar', flag: '🇦🇷', name: 'Pesos argentinos', locale: 'es-AR' },
  { code: 'CLP', country: 'cl', flag: '🇨🇱', name: 'Pesos chilenos', locale: 'es-CL' },
  { code: 'CAD', country: 'ca', flag: '🇨🇦', name: 'Dólares canadienses', locale: 'en-CA' },
  { code: 'GBP', country: 'gb', flag: '🇬🇧', name: 'Libras esterlinas', locale: 'en-GB' },
];

export const CURRENCY_BY_CODE = Object.fromEntries(CURRENCY_CATALOG.map((currency) => [currency.code, currency]));
export const CURRENCY_CODES = CURRENCY_CATALOG.map(({ code }) => code);

export function getCurrency(code = 'DOP') {
  return CURRENCY_BY_CODE[String(code).toUpperCase()] || CURRENCY_BY_CODE.DOP;
}

export function formatCurrency(value, code = 'DOP') {
  const currency = getCurrency(code);
  return new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code }).format(Number(value || 0));
}
