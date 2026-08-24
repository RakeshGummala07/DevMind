import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PageContainer from '../components/PageContainer.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';

const METRICS = [
  { label: 'Repositories indexed', value: '12' },
  { label: 'Open pull requests', value: '7' },
  { label: 'AI reviews this week', value: '34' },
  { label: 'Avg. review time', value: '4.2m' },
];

// Placeholder shape — replaced by GET /api/analytics/dashboard once analysis-service is live.
const ACTIVITY = [
  { day: 'Mon', commits: 12 },
  { day: 'Tue', commits: 19 },
  { day: 'Wed', commits: 14 },
  { day: 'Thu', commits: 27 },
  { day: 'Fri', commits: 21 },
  { day: 'Sat', commits: 8 },
  { day: 'Sun', commits: 5 },
];

export default function DashboardPage() {
  return (
    <PageContainer>
      <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Engineering activity across every connected repository.
      </p>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}
      >
        {METRICS.map((metric) => (
          <motion.div
            key={metric.label}
            variants={fadeUp}
            transition={transitions.base}
            style={{
              padding: 20,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface-1)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, marginBottom: 6 }}>
              {metric.value}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{metric.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ ...transitions.base, delay: stagger.dashboard * METRICS.length }}
        style={{
          padding: 20,
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface-1)',
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Commit activity</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={ACTIVITY}>
            <defs>
              <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="commits" stroke="var(--signal)" fill="url(#commitFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </PageContainer>
  );
}
