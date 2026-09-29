import { useReducedMotion } from 'framer-motion';

export const chartTooltipStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius)',
  fontSize: 12,
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-2)',
};

export function useChartAnimation() {
  return !useReducedMotion();
}

/** Gives a chart an accessible name + summary; the SVG itself is decorative to screen readers. */
export function ChartFrame({ label, summary, children }) {
  return (
    <figure className="chart" aria-label={label}>
      <figcaption className="sr-only">{summary ?? label}</figcaption>
      <div aria-hidden="true">{children}</div>
    </figure>
  );
}
