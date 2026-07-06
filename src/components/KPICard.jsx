export default function KPICard({ title, value, icon: Icon, color = 'navy', change, changeType }) {
  const colorClasses = {
    navy: 'bg-navy-50 text-navy-500',
    success: 'bg-success-50 text-success-500',
    warning: 'bg-warning-50 text-warning-500',
    danger: 'bg-danger-50 text-danger-500',
  };

  return (
    <div className="bg-white rounded-12 p-6 shadow-card border border-surface-border hover:shadow-card-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-[28px] font-bold text-navy-500 leading-tight">{value}</p>
          {change && (
            <p className={`text-sm mt-2 font-medium ${changeType === 'positive' ? 'text-success-500' : 'text-danger-500'}`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-12 ${colorClasses[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
