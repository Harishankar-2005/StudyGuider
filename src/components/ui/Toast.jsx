import { useCallback, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";
import { ToastContext } from "./useToast";
import "./Toast.css";

let toastId = 0;

// Global toast provider. Wrap the app shell once, then call:
// const { notify } = useToast(); notify("Saved!", "success")
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message, type = "success", sub = "") => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-2), { id, message, type, sub }]);
      const timer = setTimeout(() => dismiss(id), 3600);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" ? (
                <FiCheckCircle />
              ) : toast.type === "error" ? (
                <FiAlertTriangle />
              ) : (
                <FiInfo />
              )}
            </span>
            <div className="toast-text">
              <strong>{toast.message}</strong>
              {toast.sub && <small>{toast.sub}</small>}
            </div>
            <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
