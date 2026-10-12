import { useId } from "react";
import { useInView } from "../../hooks/useInView";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./ProgressRing.css";

// Animated SVG progress ring. Animates stroke when scrolled into view.
// size: px diameter. stroke: ring thickness. label: center content.
function ProgressRing({ percent, size = 120, stroke = 11, label, sublabel }) {
  const gradientId = useId();
  const [setRef, inView] = useInView({ threshold: 0.4 });
  const reduced = usePrefersReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = reduced || inView ? circumference - (clamped / 100) * circumference : circumference;

  return (
    <div ref={setRef} className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${clamped}%`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <strong>{label}</strong>
        {sublabel && <small>{sublabel}</small>}
      </div>
    </div>
  );
}

export default ProgressRing;
