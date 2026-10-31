export default function Select({
  label,
  error,
  helper,
  className = '',
  id,
  children,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full px-3 py-2 rounded-input border text-sm bg-surface text-text
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors
          ${error ? 'border-danger focus:ring-danger' : 'border-border'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  );
}
