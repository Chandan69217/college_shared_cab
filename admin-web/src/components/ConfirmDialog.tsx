import React from 'react';
import { AlertTriangle, Info, HelpCircle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
          iconBg: 'bg-rose-500/20 border-rose-500/30',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          iconBg: 'bg-amber-500/20 border-amber-500/30',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30',
        };
      case 'primary':
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20 border-emerald-500/30',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title="" maxWidth="md">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-3.5 rounded-2xl border mb-4 ${styles.iconBg}`}>
          {styles.icon}
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${styles.btnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
