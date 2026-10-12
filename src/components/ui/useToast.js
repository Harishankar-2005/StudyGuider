import { createContext, useContext } from "react";

// Toast state lives here so Toast.jsx only exports components
// (required by react-refresh) and any file can use the hook.
export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
