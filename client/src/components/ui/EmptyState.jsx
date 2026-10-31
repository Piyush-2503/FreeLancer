import Button from './Button.jsx';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-text-muted" />
        </div>
      )}
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-xs mb-4">{description}</p>}
      {action && actionLabel && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
