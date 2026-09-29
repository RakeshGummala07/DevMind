import { useId } from 'react';

/**
 * DevMind mark: a "D" (the product) holding an ember node (the system
 * reasoning) that traces out to a signal node on the boundary (a grounded,
 * cited result). Same two colours the whole UI uses for the same two ideas.
 */
export function LogoMark({ size = 28, title }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="#0f131b" stroke="#313b50" />
      <path
        d="M10.5 8.75h5a7.25 7.25 0 0 1 0 14.5h-5z"
        fill="none"
        stroke="#e8eaf0"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path id={`${id}-t`} d="M15 16h6.75" stroke="#35d0ba" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="16" r="2.4" fill="#ff8a3d" />
      <circle cx="22.75" cy="16" r="1.9" fill="#35d0ba" />
    </svg>
  );
}

export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {showWordmark && <span className="logo__word">DevMind</span>}
    </span>
  );
}
