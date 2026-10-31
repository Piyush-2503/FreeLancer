import { useToast } from '../../context/ToastContext.jsx';
import { ToastContainer } from './Toast.jsx';

export default function ToastHost() {
  const { toasts, dismiss } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismiss} />;
}
