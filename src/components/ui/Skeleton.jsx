import "./Skeleton.css";

// Shimmer placeholder shown while local content prepares.
// lines: number of text rows. Use for charts / lists switching tabs.
export function Skeleton({ lines = 3, height = 14 }) {
  return (
    <div className="skeleton-block" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="skeleton-line"
          style={{ height, width: `${92 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <span className="skeleton-line" style={{ width: "45%", height: 18 }} />
      <span className="skeleton-line" style={{ width: "85%", height: 13 }} />
      <span className="skeleton-line" style={{ width: "70%", height: 13 }} />
    </div>
  );
}
