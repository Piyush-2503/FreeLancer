import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent',
  secondary: 'bg-surface border border-border text-text hover:bg-surface-subtle focus:ring-accent',
  danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
  ghost: 'text-text-secondary hover:bg-surface-subtle focus:ring-accent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-input
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
