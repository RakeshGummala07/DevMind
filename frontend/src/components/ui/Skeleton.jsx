export function Skeleton({ width, height = 14, radius, style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** Loading placeholder for a stat tile / small card. */
export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton width="42%" height={22} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '90%'} height={12} style={{ marginTop: 8 }} />
      ))}
    </div>
  );
}

/** Wraps a set of skeletons so assistive tech hears a single "Loading" message. */
export function LoadingRegion({ label = 'Loading', children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}
