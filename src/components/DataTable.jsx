export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-white rounded-16 shadow-card border border-surface-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-navy-900 border-b border-navy-700">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-200">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                className="cursor-pointer transition-colors hover:bg-warning-50/40"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-navy-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
