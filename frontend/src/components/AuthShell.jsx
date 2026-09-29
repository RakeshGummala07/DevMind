import { Link } from 'react-router-dom';
import { m } from './Motion.jsx';
import Logo from './Logo.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const POINTS = [
  'Every answer cites the file, class and commit it came from.',
  'If the index has no evidence, DevMind says so instead of guessing.',
  'AI reviews flag findings as grounded or diff-only.',
];

/** Split layout shared by sign-in / register: brand story on the left, form on the right. */
export default function AuthShell({ children }) {
  const reduced = useReducedMotion();
  return (
    <div className="auth">
      <aside className="auth__brand" aria-hidden={false}>
        <Link to="/" className="logo-link" aria-label="DevMind home">
          <Logo size={32} />
        </Link>

        <div className="auth__story">
          <div className="auth__trace" aria-hidden="true">
            <svg viewBox="0 0 420 120" fill="none">
              <path d="M12 60 H120 C150 60 150 24 180 24 H260 C290 24 290 60 320 60 H392" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 60 H120 C150 60 150 96 180 96 H260 C290 96 290 60 320 60" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
              {!reduced && (
                <m.path
                  d="M12 60 H120 C150 60 150 24 180 24 H260 C290 24 290 60 320 60 H392"
                  stroke="var(--ember)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.3 }}
                />
              )}
              {reduced && <path d="M12 60 H120 C150 60 150 24 180 24 H260 C290 24 290 60 320 60 H392" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" />}
              <circle cx="12" cy="60" r="6" fill="var(--ember)" />
              <circle cx="392" cy="60" r="6" fill="var(--signal)" />
            </svg>
          </div>
          <h2 className="auth__headline">Answers you can trace back to source.</h2>
          <ul className="auth__points">
            {POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth__main" id="main">
        <m.div className="auth__panel" initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.page}>
          <div className="auth__mobile-logo">
            <Link to="/" className="logo-link" aria-label="DevMind home">
              <Logo />
            </Link>
          </div>
          {children}
        </m.div>
      </main>
    </div>
  );
}
