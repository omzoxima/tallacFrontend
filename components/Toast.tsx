'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Global toast state
let toastState: Toast[] = [];
const listeners: Set<() => void> = new Set();

const notify = () => {
  listeners.forEach(listener => listener());
};

export const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
  const id = Math.random().toString(36).substring(7);
  const toast: Toast = { id, message, type, duration };
  toastState = [...toastState, toast];
  notify();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
};

export const removeToast = (id: string) => {
  toastState = toastState.filter(t => t.id !== id);
  notify();
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const updateToasts = () => {
      setToasts([...toastState]);
    };
    
    listeners.add(updateToasts);
    updateToasts();

    return () => {
      listeners.delete(updateToasts);
    };
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 border-green-500 text-white';
      case 'error':
        return 'bg-red-600/90 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500 text-white';
      default:
        return 'bg-blue-600/90 border-blue-500 text-white';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-md w-full sm:w-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getColors(toast.type)} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 text-sm font-medium">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

