export default function Input({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 rounded-input border text-sm
          bg-surface text-text placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors
          ${error ? 'border-danger focus:ring-danger' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  );
}
