import { useInView } from "../../hooks/useInView";
import "./Reveal.css";

// Fades + slides children in the first time they enter the viewport.
// delay: stagger offset in ms. Keep it small so UI never feels slow.
function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const [setRef, inView] = useInView({ threshold: 0.12 });

  return (
    <Tag
      ref={setRef}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

// Fire-and-forget entrance for above-the-fold content (no observer needed).
export function RevealNow({ children, delay = 0, className = "" }) {
  return (
    <div className={`reveal is-visible reveal-now ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default Reveal;
