export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-surface rounded-card shadow-card border border-border ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
