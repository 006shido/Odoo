import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = 'info', duration = 3800 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: ToastItem = { id, title, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Apple Dynamic Island / Floating HUD Toast Viewport */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-md w-[92vw] pointer-events-none">
        {toasts.map((t) => {
          const Icon =
            t.type === 'success'
              ? CheckCircle2
              : t.type === 'error'
              ? XCircle
              : t.type === 'warning'
              ? AlertCircle
              : Info;

          const iconColor =
            t.type === 'success'
              ? 'text-success'
              : t.type === 'error'
              ? 'text-error'
              : t.type === 'warning'
              ? 'text-warning'
              : 'text-accent';

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-center gap-3.5 px-4 py-3 rounded-2xl shadow-apple-floating transition-all duration-300 ease-out select-none',
                'animate-in slide-in-from-top-4 fade-in zoom-in-95',
                'bg-surface/90 dark:bg-surface/85 backdrop-blur-2xl border border-border/80 text-text-primary',
                'w-full max-w-sm',
              )}
            >
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', 
                t.type === 'success' ? 'bg-success/15' : t.type === 'error' ? 'bg-error/15' : t.type === 'warning' ? 'bg-warning/15' : 'bg-accent/15'
              )}>
                <Icon className={cn('h-4 w-4', iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-tight leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-tight truncate">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded-full transition-colors active:scale-90"
                aria-label="Close notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
