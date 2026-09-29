export default function Badge({ tone = 'neutral', dot = false, pulse = false, children, title, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} title={title}>
      {dot && <span className={`badge__dot${pulse ? ' badge__dot--pulse' : ''}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
