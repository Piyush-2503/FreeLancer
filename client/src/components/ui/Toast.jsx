import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-success-soft border-success text-success',
  error: 'bg-danger-soft border-danger text-danger',
  warning: 'bg-warning-soft border-warning text-warning',
  info: 'bg-accent-soft border-accent text-accent',
};

export function Toast({ id, message, type = 'info', onDismiss }) {
  const Icon = icons[type] || Info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-card border shadow-card min-w-72 max-w-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={() => onDismiss(id)} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
