import Flag from './Flag';

export default function CurrencyFlag({ currency, className = '' }) {
  return <Flag country={currency?.country} className={className} />;
}
