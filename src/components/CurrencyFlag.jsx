export default function CurrencyFlag({ currency, className = '' }) {
  const country = currency?.country?.toLowerCase();
  if (!country) return <span className={className} role="img" aria-label="Bandera">🏳️</span>;
  return <><img className={`inline-block h-4 w-6 rounded-sm object-cover shadow-sm ${className}`} src={`https://flagcdn.com/w40/${country}.png`} alt={currency.name ? `Bandera de ${currency.name}` : 'Bandera'} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling?.removeAttribute('hidden'); }} /><span hidden className={className} role="img" aria-label={currency.name}>{currency.flag}</span></>;
}
