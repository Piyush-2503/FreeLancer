import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Table({ columns, data, onSort, sortBy, sortDir, loading, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-border">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-surface-subtle rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-card border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-text select-none' : ''}`}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row._id || row.id || i} className="border-t border-border hover:bg-surface-subtle transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-text">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
