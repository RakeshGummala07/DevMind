import { useEffect, useState } from 'react';

/**
 * Tracks the user's OS-level `prefers-reduced-motion` setting so components
 * can drop non-essential animation. Framer Motion respects this at the CSS
 * level for most transitions already (see tokens.css), but interactive
 * components — the trace line, streaming reveals — check this explicitly
 * so they can skip straight to the end state instead of just speeding up.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event) => setReduced(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}
