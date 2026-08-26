import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';

const PROOF_POINTS = [
  { label: 'Grounded answers', detail: 'Every claim cites the file, class, and commit it came from.' },
  { label: 'Nothing invented', detail: 'If the index has no evidence, DevMind says so instead of guessing.' },
  { label: 'Runs on your infra', detail: 'Local embeddings, local inference, your Qdrant index — no code leaves the network.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={transitions.page}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        textAlign: 'center',
        gap: 28,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ember)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        AI developer intelligence
      </span>

      <h1 style={{ fontSize: 44, maxWidth: 640, lineHeight: 1.15 }}>
        Ask your codebase questions it can actually answer.
      </h1>

      <p style={{ color: 'var(--text-secondary)', maxWidth: 480, fontSize: 15 }}>
        DevMind indexes your repositories with retrieval-augmented generation, so every
        answer, review finding, and doc traces back to real source — never a guess.
      </p>

      <div style={{ width: 'min(280px, 80vw)' }}>
        <TraceLine active tone="ember" />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={() => navigate('/login')}>Sign in with GitHub</Button>
        <Button variant="secondary" onClick={() => navigate('/register')}>
          Create an account
        </Button>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
        style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {PROOF_POINTS.map((point) => (
          <motion.div
            key={point.label}
            variants={fadeUp}
            transition={transitions.base}
            style={{
              width: 220,
              padding: 18,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface-1)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, marginBottom: 6 }}>
              {point.label}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{point.detail}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
