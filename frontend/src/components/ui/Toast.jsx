import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IconCircleCheck, IconAlertTriangle, IconInfoCircle, IconX } from '@tabler/icons-react';
import { m } from '../Motion.jsx';
import { transitions } from '../../utils/motionTokens.js';

const ToastContext = createContext(null);

const ICONS = { success: IconCircleCheck, error: IconAlertTriangle, info: IconInfoCircle };
const LIFETIME_MS = { success: 4000, info: 4000, error: 7000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone, message) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), LIFETIME_MS[tone]);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-label="Notifications">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone];
            return (
              <m.div
                key={toast.id}
                layout={false}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
                transition={transitions.base}
                className={`toast toast--${toast.tone}`}
                role={toast.tone === 'error' ? 'alert' : 'status'}
              >
                <Icon size={18} aria-hidden="true" className="toast__icon" />
                <p className="toast__message">{toast.message}</p>
                <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                  <IconX size={14} />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
