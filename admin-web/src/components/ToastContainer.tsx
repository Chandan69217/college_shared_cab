import React from 'react';
import { useToast, ToastType } from '../context/ToastContext';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
          accent: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/90 border-blue-500/40 text-blue-100 shadow-blue-950/50',
          icon: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />,
          accent: 'bg-blue-500',
        };
    }
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 sm:px-0"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${styles.bg}`}
          >
            {styles.icon}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="font-semibold text-sm leading-tight text-white mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs leading-relaxed opacity-90 break-words">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/10 flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
