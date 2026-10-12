import { useEffect, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

// Counts from 0 to `value` when first visible. Respects reduced motion.
// decimals: digits after the point. suffix: e.g. "%", " hrs".
function AnimatedNumber({ value, decimals = 0, suffix = "", duration = 1100 }) {
  const [setRef, inView] = useInView({ threshold: 0.4 });
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    // Reduced motion: skip the animation entirely and render the
    // final value directly (see `shown` below — no state update here).
    if (reduced) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      // Runs in a rAF callback, outside the render cycle.
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  const shown = reduced ? (inView ? value : 0) : display;

  return (
    <span ref={setRef}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;
