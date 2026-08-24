import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

/**
 * @param {boolean} active - true while an async operation is in flight
 *   (indexing, chat generation, PR analysis). Dormant otherwise.
 * @param {'ember'|'signal'} tone - ember for "reasoning in progress",
 *   signal for "grounded result arriving" (e.g. sources resolving).
 */
export default function TraceLine({ active = false, tone = 'ember' }) {
  const reducedMotion = useReducedMotion();
  const color = tone === 'signal' ? 'var(--signal)' : 'var(--ember)';

  return (
    <div
      style={{
        position: 'relative',
        height: 2,
        width: '100%',
        background: 'var(--border)',
        overflow: 'hidden',
        borderRadius: 2,
      }}
      role="status"
      aria-label={active ? 'Working' : undefined}
    >
      {active && !reducedMotion && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '30%',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
          initial={{ x: '-30%' }}
          animate={{ x: '130%' }}
          transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
        />
      )}
      {active && reducedMotion && (
        <div style={{ position: 'absolute', inset: 0, background: color, opacity: 0.6 }} />
      )}
    </div>
  );
}
