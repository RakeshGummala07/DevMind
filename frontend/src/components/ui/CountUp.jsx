import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Counts up to a real, already-fetched integer. Non-numeric values render as-is. */
export default function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const isNumber = typeof value === 'number' && Number.isFinite(value);

  useEffect(() => {
    if (!isNumber || !inView || reduced || !ref.current) return undefined;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, inView, reduced, isNumber]);

  return <span ref={ref}>{isNumber ? value.toLocaleString() : value}</span>;
}
