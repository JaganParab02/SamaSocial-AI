/**
 * ConfirmationDialog — modal dialog for destructive actions.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                <p className="text-sm text-slate-400 mt-1">{message}</p>
              </div>
              <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
