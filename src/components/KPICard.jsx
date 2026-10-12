export default function KPICard({ title, value, icon: Icon, color = 'navy', change, changeType }) {
  const colorClasses = {
    navy: 'bg-navy-50 text-navy-500',
    success: 'bg-success-50 text-success-500',
    warning: 'bg-warning-50 text-warning-500',
    danger: 'bg-danger-50 text-danger-500',
    accent: 'bg-accent-50 text-accent-600',
  };

  return (
    <div className="rounded-16 border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-lg sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <p className="mt-1.5 font-display text-[30px] font-extrabold leading-tight text-navy-500">{value}</p>
          {change && (
            <p className={`text-sm mt-2 font-medium ${changeType === 'positive' ? 'text-success-500' : 'text-danger-500'}`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        <div className={`rounded-12 p-3 ${colorClasses[color] || colorClasses.navy}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
