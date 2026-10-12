import { useEffect, useState } from "react";

// useState persisted to localStorage — keeps planner tasks,
// toasts-dismissed flags and wizard progress across reloads.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full / private mode — app still works in memory.
    }
  }, [key, value]);

  return [value, setValue];
}
