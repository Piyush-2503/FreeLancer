export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface-subtle rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-card border border-border p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 items-center py-3 border-b border-border">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/5" />
      <Skeleton className="h-4 w-1/6" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <div className="bg-subtle px-4 py-3 flex gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-3 w-20" />)}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-6 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
