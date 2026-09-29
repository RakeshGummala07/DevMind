import { useId, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  IconBrandGithub, IconDatabaseImport, IconMessageQuestion, IconMessageCircle, IconSearch, IconGitPullRequest,
  IconFileText, IconChartBar, IconBell, IconChevronDown, IconCircleCheck,
} from '@tabler/icons-react';
import { m } from '../../components/Motion.jsx';
import Button from '../../components/Button.jsx';
import { reveal, transitions, stagger } from '../../utils/motionTokens.js';

const STEPS = [
  { Icon: IconBrandGithub, title: 'Connect a repository', text: 'Sign in with GitHub and pick the repositories you want DevMind to know about.' },
  { Icon: IconDatabaseImport, title: 'Index the source', text: 'The code is split into chunks, embedded, and stored in a vector index you host.' },
  { Icon: IconMessageQuestion, title: 'Ask, search, review', text: 'Questions retrieve the most relevant chunks first, then an answer is written from them.' },
  { Icon: IconCircleCheck, title: 'Check the citations', text: 'Each answer lists the files and line ranges it used. No evidence is flagged, not hidden.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-title">
      <div className="site-wrap">
        <m.div {...reveal} className="section__head">
          <h2 id="how-title">From repository to cited answer in four steps</h2>
          <p>Retrieval comes first. The model only writes from what was actually found in your code.</p>
        </m.div>
        <ol className="steps">
          {STEPS.map(({ Icon, title, text }, i) => (
            <m.li
              key={title}
              className="step"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...transitions.page, delay: i * stagger.dashboard * 1.5 }}
            >
              <span className="step__n" aria-hidden="true">{i + 1}</span>
              <span className="step__icon" aria-hidden="true"><Icon size={20} stroke={1.6} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </m.li>
          ))}
        </ol>

        <m.figure {...reveal} className="flow" aria-label="Architecture overview">
          <svg viewBox="0 0 760 120" role="img" aria-label="GitHub feeds ingestion, which fills the vector index; the AI service retrieves from it to power chat, search, reviews and docs.">
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--text-muted)" /></marker>
            </defs>
            {[['GitHub', 10], ['Ingestion', 205], ['Vector index', 400], ['AI service', 595]].map(([label, x], i) => (
              <g key={label}>
                <rect x={x} y="30" width="155" height="60" rx="10" fill="var(--surface-2)" stroke={i === 2 ? 'var(--signal-line)' : 'var(--border-strong)'} />
                <text x={x + 77.5} y="66" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize="15" fontWeight="600">{label}</text>
                {i < 3 && <line x1={x + 158} y1="60" x2={x + 200} y2="60" stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="4 4" className="flow__dash" />}
              </g>
            ))}
            <circle cx="88" cy="20" r="4" fill="var(--ember)" />
            <circle cx="672" cy="20" r="4" fill="var(--signal)" />
          </svg>
          <figcaption>Ember marks the system working; signal marks grounded results.</figcaption>
        </m.figure>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    Icon: IconMessageCircle, title: 'Codebase chat', wide: true,
    text: 'Ask how something works and get an answer with the exact files and line ranges it used. Earlier conversations are kept per repository.',
    visual: (
      <div className="fv fv--chat" aria-hidden="true">
        <span className="source-chip"><IconCircleCheck size={12} /> billing/InvoiceService.java:18-64</span>
        <span className="source-chip"><IconCircleCheck size={12} /> billing/TaxRules.java:5-40</span>
      </div>
    ),
  },
  {
    Icon: IconSearch, title: 'Semantic code search',
    text: 'Search by meaning instead of exact keywords. Results are ranked by relevance to your query.',
    visual: <div className="fv fv--search" aria-hidden="true"><span className="mono">retry logic for failed jobs</span><b className="mono">92%</b></div>,
  },
  {
    Icon: IconGitPullRequest, title: 'AI pull-request review', wide: true,
    text: 'Request a review of any open PR. Findings are sorted by severity and marked grounded when backed by your indexed source, or diff-only when they are not.',
    visual: (
      <div className="fv fv--sev" aria-hidden="true">
        {[['Critical', 'var(--critical)'], ['Major', 'var(--high)'], ['Minor', 'var(--medium)'], ['Info', 'var(--info)']].map(([l, c]) => (
          <span key={l} style={{ '--sev': c }}>{l}</span>
        ))}
      </div>
    ),
  },
  {
    Icon: IconFileText, title: 'Generated documentation',
    text: 'Create a README, architecture overview, API reference or onboarding guide from the indexed source.',
    visual: <div className="fv fv--docs mono" aria-hidden="true"><span>README</span><span>ARCHITECTURE</span><span>API</span><span>ONBOARDING</span></div>,
  },
  {
    Icon: IconChartBar, title: 'Engineering analytics',
    text: 'Commit activity, PR throughput, review turnaround and AI usage — per repository and across all of them.',
  },
  {
    Icon: IconBell, title: 'Notifications you control',
    text: 'Get told when indexing or a review finishes, and mute the types you do not want.',
  },
];

export function Features() {
  return (
    <section id="features" className="section section--alt" aria-labelledby="features-title">
      <div className="site-wrap">
        <m.div {...reveal} className="section__head">
          <h2 id="features-title">Everything reads from the same index</h2>
          <p>One indexed copy of your source powers chat, search, reviews and docs, so they agree with each other.</p>
        </m.div>
        <div className="bento">
          {FEATURES.map(({ Icon, title, text, wide, visual }, i) => (
            <m.article
              key={title}
              className={`bento__item${wide ? ' bento__item--wide' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...transitions.page, delay: (i % 3) * stagger.dashboard }}
            >
              <span className="bento__icon" aria-hidden="true"><Icon size={18} stroke={1.7} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              {visual}
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  ['USER', 'Connect and query your own repositories.'],
  ['DEVELOPER', 'Trigger indexing and request AI reviews on team repositories.'],
  ['TEAM_ADMIN', 'Manage team membership and repository permissions.'],
  ['ADMIN', 'Full platform access, including user and role management.'],
];

export function Teams() {
  return (
    <section className="section" aria-labelledby="teams-title">
      <div className="site-wrap teams">
        <m.div {...reveal} className="section__head section__head--left">
          <h2 id="teams-title">Built for teams, with roles</h2>
          <p>Access is role-based and enforced by the backend, so what people can do matches what they are allowed to do.</p>
        </m.div>
        <m.dl {...reveal} className="roles">
          {ROLES.map(([role, desc]) => (
            <div key={role}>
              <dt className="mono">{role}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </m.dl>
      </div>
    </section>
  );
}

const FAQS = [
  ['What does “grounded” mean?', 'A grounded answer or review finding is backed by chunks retrieved from your indexed repository, and lists where they came from. When nothing relevant is found, DevMind marks the result as not grounded instead of presenting a guess as fact.'],
  ['Which repositories can I use?', 'GitHub repositories. Sign in with GitHub, then connect the ones your account can access — public or private — and index them.'],
  ['Where does my code go?', 'DevMind is designed to run on your own infrastructure with a self-hosted vector index. The AI provider and models are set by your administrator at deploy time, and you can see the current provider in Settings.'],
  ['What documentation can it generate?', 'A README, an architecture overview, an API reference by controller, and an onboarding guide for new developers. Each is written from the indexed source and can be regenerated.'],
  ['What do the roles allow?', 'USER, DEVELOPER, TEAM_ADMIN and ADMIN, from standard access up to full platform and role management. The backend enforces them.'],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <section id="faq" className="section section--alt" aria-labelledby="faq-title">
      <div className="site-wrap faq">
        <m.div {...reveal} className="section__head section__head--left">
          <h2 id="faq-title">Questions, answered</h2>
        </m.div>
        <div className="faq__list">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="faq__item">
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`${base}-${i}`} id={`${base}-b${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                    {q}
                    <IconChevronDown size={18} aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      id={`${base}-${i}`}
                      role="region"
                      aria-labelledby={`${base}-b${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={transitions.base}
                      style={{ overflow: 'hidden' }}
                    >
                      <p>{a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const authenticated = useSelector((s) => s.auth.status === 'authenticated');
  return (
    <section className="section" aria-labelledby="cta-title">
      <m.div {...reveal} className="site-wrap cta">
        <h2 id="cta-title">Point it at a repository and ask the first question.</h2>
        <div className="cta__actions">
          {authenticated ? (
            <Button to="/dashboard">Open dashboard</Button>
          ) : (
            <>
              <Button to="/login" icon={IconBrandGithub}>Sign in with GitHub</Button>
              <Button to="/register" variant="secondary">Create an account</Button>
            </>
          )}
        </div>
      </m.div>
    </section>
  );
}
