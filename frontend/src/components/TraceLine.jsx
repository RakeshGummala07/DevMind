import { m } from './Motion.jsx';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

/**
 * The product's signature progress indicator.
 * @param {boolean} active - true while an async operation is in flight
 *   (indexing, chat generation, PR analysis). Dormant otherwise.
 * @param {'ember'|'signal'} tone - ember = "reasoning in progress",
 *   signal = "grounded result arriving".
 */
export default function TraceLine({ active = false, tone = 'ember', label = 'Working' }) {
  const reducedMotion = useReducedMotion();
  const color = tone === 'signal' ? 'var(--signal)' : 'var(--ember)';

  return (
    <div className="trace" role={active ? 'status' : undefined} aria-label={active ? label : undefined}>
      {active && !reducedMotion && (
        <m.div
          className="trace__beam"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          initial={{ x: '-30%' }}
          animate={{ x: '340%' }}
          transition={{ duration: 1.15, ease: 'linear', repeat: Infinity }}
        />
      )}
      {active && reducedMotion && <div className="trace__static" style={{ background: color }} />}
    </div>
  );
}
