import { useEffect, useState } from "react";

// Observes when an element scrolls into view (once by default).
// Used to trigger entrance + chart animations only when visible.
export function useInView(options = {}) {
  const { threshold = 0.2, once = true } = options;
  // No-JS-observer environments count as immediately visible.
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (!ref || (once && inView)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Runs in an observer callback (not the effect body), so this
        // state update doesn't cascade with the render cycle.
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, once, inView]);

  return [setRef, inView];
}
