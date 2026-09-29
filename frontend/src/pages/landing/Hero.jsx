import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useScroll, useTransform } from 'framer-motion';
import { IconBrandGithub, IconCircleCheck, IconReload } from '@tabler/icons-react';
import { m } from '../../components/Motion.jsx';
import Button from '../../components/Button.jsx';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { transitions } from '../../utils/motionTokens.js';

const QUESTION = 'Where are refresh tokens validated?';
const ANSWER =
  'Refresh tokens are validated in TokenService.validateRefresh(). It checks the signature and expiry, then looks up the stored token hash before issuing a new access token.';
const SOURCES = ['auth/TokenService.java:42-88', 'auth/AuthController.java:61-79'];

/**
 * Illustration of the product's core loop. It is a scripted example, not live data,
 * and is labelled as such. Phases: 0 typing · 1 retrieving (ember) · 2 answered (signal).
 */
function DemoPanel() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(reduced ? QUESTION.length : 0);
  const [phase, setPhase] = useState(reduced ? 2 : 0);
  const [run, setRun] = useState(0);
  const timers = useRef([]);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reduced) {
      setTyped(QUESTION.length);
      setPhase(2);
      return;
    }
    setTyped(0);
    setPhase(0);
    QUESTION.split('').forEach((_, i) => timers.current.push(setTimeout(() => setTyped(i + 1), 700 + i * 32)));
    const t = 700 + QUESTION.length * 32;
    timers.current.push(setTimeout(() => setPhase(1), t + 350));
    timers.current.push(setTimeout(() => setPhase(2), t + 2200));
  }, [reduced]);

  useEffect(() => {
    play();
    return () => timers.current.forEach(clearTimeout);
  }, [play, run]);

  return (
    <div className="demo" role="group" aria-label="Illustration: a question answered with citations">
      <div className="demo__bar">
        <span className="demo__dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="demo__title mono">acme/payments-api · Chat</span>
        <span className="demo__tag">Illustration</span>
      </div>

      <div className="demo__body">
        <div className="demo__q">
          <span className="sr-only">Question: {QUESTION}</span>
          <span aria-hidden="true">{QUESTION.slice(0, typed)}<i className={`demo__caret${phase === 0 ? ' is-on' : ''}`} /></span>
        </div>

        <div className={`demo__trace demo__trace--${phase === 1 ? 'ember' : phase === 2 ? 'signal' : 'idle'}`} aria-hidden="true">
          <span />
        </div>
        <p className="demo__status mono" aria-hidden="true">
          {phase === 0 && 'waiting for a question'}
          {phase === 1 && 'retrieving relevant source…'}
          {phase === 2 && '2 sources retrieved'}
        </p>

        <div className="demo__a" style={{ opacity: phase === 2 ? 1 : 0.0, transform: phase === 2 ? 'none' : 'translateY(6px)' }} aria-hidden={phase !== 2}>
          <p>{ANSWER}</p>
          <ul className="demo__sources" aria-label="Sources">
            {SOURCES.map((s, i) => (
              <li key={s} className="source-chip" style={{ transitionDelay: `${i * 140}ms`, opacity: phase === 2 ? 1 : 0 }}>
                <IconCircleCheck size={12} aria-hidden="true" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" className="demo__replay" onClick={() => setRun((r) => r + 1)} aria-label="Replay the example">
        <IconReload size={14} aria-hidden="true" /> Replay
      </button>
    </div>
  );
}

export default function Hero() {
  const authenticated = useSelector((s) => s.auth.status === 'authenticated');
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 48]);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="site-wrap hero__inner">
        <m.div
          className="hero__copy"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.page}
        >
          <h1 id="hero-title" className="hero__title">Ask your codebase questions it can actually answer.</h1>
          <p className="hero__lead">
            DevMind indexes your repositories with retrieval-augmented generation, so every answer, review finding and
            doc traces back to real source — never a guess.
          </p>
          <div className="hero__cta">
            {authenticated ? (
              <Button to="/dashboard">Open dashboard</Button>
            ) : (
              <>
                <Button to="/login" icon={IconBrandGithub}>Sign in with GitHub</Button>
                <Button to="/register" variant="secondary">Create an account</Button>
              </>
            )}
          </div>
          <ul className="hero__proof">
            <li><strong>Grounded answers</strong> cite the file and lines they came from.</li>
            <li><strong>Nothing invented.</strong> No evidence in the index means DevMind says so.</li>
            <li><strong>Built for your infrastructure.</strong> Self-hosted index; your admin chooses the AI provider.</li>
          </ul>
        </m.div>

        <m.div className="hero__visual" style={{ y }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1 }} transition={{ ...transitions.page, delay: 0.15 }}>
          <DemoPanel />
        </m.div>
      </div>
    </section>
  );
}
