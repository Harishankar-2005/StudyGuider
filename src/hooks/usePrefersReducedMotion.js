import { useEffect, useState } from "react";

// Tracks the OS-level reduced-motion preference so JS animations
// (count-ups, typing effects) can be skipped for accessibility.
export function usePrefersReducedMotion() {
  // Read the preference during initial state (no effect needed for that).
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Listener callback — runs outside the render/effect cycle.
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
