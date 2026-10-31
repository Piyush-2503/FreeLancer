import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const nums = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      nums.push(i);
    }
    return nums;
  };

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-sm text-text-muted">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-input text-text-secondary hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map(n => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-8 h-8 rounded-input text-sm font-medium transition-colors ${
              n === page
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded-input text-text-secondary hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
