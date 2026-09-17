import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getApiErrorMessage } from '../services/api';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string | any, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: any, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: any, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ message: string; timestamp: number }>({ message: '', timestamp: 0 });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, rawMessage: string | any, title?: string, duration: number = 4000) => {
      let message = '';
      if (typeof rawMessage === 'string') {
        message = rawMessage.trim();
      } else {
        message = getApiErrorMessage(rawMessage);
      }

      if (!message) {
        message = 'An unexpected event occurred.';
      }

      // Anti-spam deduplication: ignore exact same message within 2.5s
      const now = Date.now();
      if (
        lastToastRef.current.message === message &&
        now - lastToastRef.current.timestamp < 2500
      ) {
        return;
      }
      lastToastRef.current = { message, timestamp: now };

      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, title?: string, duration?: number) => addToast('success', msg, title, duration),
    [addToast]
  );

  const error = useCallback(
    (msg: any, title?: string, duration?: number) => addToast('error', msg, title, duration),
    [addToast]
  );

  const warning = useCallback(
    (msg: string, title?: string, duration?: number) => addToast('warning', msg, title, duration),
    [addToast]
  );

  const info = useCallback(
    (msg: string, title?: string, duration?: number) => addToast('info', msg, title, duration),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        success,
        error,
        warning,
        info,
        showSuccess: success,
        showError: error,
        showWarning: warning,
        showInfo: info,
        removeToast,
        clearToasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
