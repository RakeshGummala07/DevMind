import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueries } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getPullRequestSummary, getReviewSummary, getCommitActivity } from '../features/analytics/analyticsApi.js';
import { getReviewHistory } from '../features/reviews/reviewsApi.js';

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function DashboardPage() {
    const reposQuery = useQuery({ queryKey: ['repositories'], queryFn: listConnectedRepositories });
    const repos = reposQuery.data ?? [];

    const prQueries = useQueries({
        queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'prs'], queryFn: () => getPullRequestSummary(r.id), enabled: repos.length > 0 })),
    });
    const reviewSummaryQueries = useQueries({
        queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'reviews'], queryFn: () => getReviewSummary(r.id), enabled: repos.length > 0 })),
    });
    const reviewHistoryQueries = useQueries({
        queries: repos.map((r) => ({ queryKey: ['reviews', r.id, 'history'], queryFn: () => getReviewHistory(r.id), enabled: repos.length > 0 })),
    });
    const commitQueries = useQueries({
        queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'commits', 7], queryFn: () => getCommitActivity(r.id, 7), enabled: repos.length > 0 })),
    });

    const loading = reposQuery.isLoading
        || prQueries.some((q) => q.isLoading) || reviewSummaryQueries.some((q) => q.isLoading)
        || reviewHistoryQueries.some((q) => q.isLoading) || commitQueries.some((q) => q.isLoading);

    const metrics = useMemo(() => {
        const openPRs = prQueries.reduce((sum, q) => sum + (q.data?.openCount ?? 0), 0);

        const weekAgo = Date.now() - ONE_WEEK_MS;
        const reviewsThisWeek = reviewHistoryQueries.reduce(
            (sum, q) => sum + (q.data ?? []).filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length,
            0
        );

        const turnarounds = reviewSummaryQueries.map((q) => q.data?.avgTurnaroundSeconds).filter((v) => v != null);
        const avgTurnaroundSeconds = turnarounds.length > 0 ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length : null;
        const avgReviewTimeLabel = avgTurnaroundSeconds == null
            ? '—'
            : avgTurnaroundSeconds < 3600
                ? `${(avgTurnaroundSeconds / 60).toFixed(1)}m`
                : `${(avgTurnaroundSeconds / 3600).toFixed(1)}h`;

        return [
            { label: 'Repositories connected', value: String(repos.length) },
            { label: 'Open pull requests', value: String(openPRs) },
            { label: 'AI reviews this week', value: String(reviewsThisWeek) },
            { label: 'Avg. review time', value: avgReviewTimeLabel },
        ];
    }, [repos, prQueries, reviewSummaryQueries, reviewHistoryQueries]);

    // Merge each repo's last-7-days commit activity into one cross-repo series, keyed by weekday.
    const activity = useMemo(() => {
        const byDay = new Map();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            byDay.set(d.toISOString().slice(0, 10), { day: WEEKDAY.format(d), commits: 0 });
        }
        for (const q of commitQueries) {
            for (const entry of q.data?.byDay ?? []) {
                const bucket = byDay.get(entry.date);
                if (bucket) bucket.commits += entry.count;
            }
        }
        return Array.from(byDay.values());
    }, [commitQueries]);

    return (
        <PageContainer>
            <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Engineering activity across every connected repository.
            </p>

            {loading && (
                <div style={{ width: 200, marginBottom: 20 }}>
                    <TraceLine active tone="ember" />
                </div>
            )}

            {!reposQuery.isLoading && repos.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connect a repository to see activity here.</p>
            )}

            {!loading && repos.length > 0 && (
                <>
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                        className="grid-4"
                        style={{ marginBottom: 28 }}
                    >
                        {metrics.map((metric) => (
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
                        transition={{ ...transitions.base, delay: stagger.dashboard * metrics.length }}
                        style={{
                            padding: 20,
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface-1)',
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Commit activity</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={activity}>
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
                </>
            )}
        </PageContainer>
    );
}