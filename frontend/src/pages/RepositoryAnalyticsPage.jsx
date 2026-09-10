import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { IconRefresh, IconGitCommit, IconGitPullRequest } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import {
    syncRepositoryAnalytics, getCommitActivity, getPullRequestSummary, getAiUsage, getReviewSummary,
} from '../features/analytics/analyticsApi.js';

const SEVERITY_COLOR = { CRITICAL: 'var(--critical)', MAJOR: 'var(--high)', MINOR: 'var(--medium)', INFO: 'var(--info)' };

function MetricCard({ label, value, index }) {
    return (
        <motion.div
            variants={fadeUp}
            transition={{ ...transitions.base, delay: index * stagger.dashboard }}
            style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}
        >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 4 }}>{value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</div>
        </motion.div>
    );
}

function Card({ title, children }) {
    return (
        <div style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
            <h3 style={{ marginBottom: 16, fontSize: 14 }}>{title}</h3>
            {children}
        </div>
    );
}

export default function RepositoryAnalyticsPage() {
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();

    const commitsQuery = useQuery({ queryKey: ['analytics', repositoryId, 'commits'], queryFn: () => getCommitActivity(repositoryId, 30) });
    const prsQuery = useQuery({ queryKey: ['analytics', repositoryId, 'prs'], queryFn: () => getPullRequestSummary(repositoryId) });
    const aiUsageQuery = useQuery({ queryKey: ['analytics', repositoryId, 'ai-usage'], queryFn: () => getAiUsage(repositoryId) });
    const reviewQuery = useQuery({ queryKey: ['analytics', repositoryId, 'reviews'], queryFn: () => getReviewSummary(repositoryId) });

    const syncMutation = useMutation({
        mutationFn: () => syncRepositoryAnalytics(repositoryId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics', repositoryId] }),
    });

    const loading = commitsQuery.isLoading || prsQuery.isLoading || aiUsageQuery.isLoading || reviewQuery.isLoading;

    const avgMergeHours = prsQuery.data?.avgTimeToMergeHours;
    const avgTurnaroundMin = reviewQuery.data?.avgTurnaroundSeconds != null ? (reviewQuery.data.avgTurnaroundSeconds / 60).toFixed(1) : null;

    return (
        <PageContainer>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <h2>Repository analytics</h2>
                <motion.button
                    onClick={() => syncMutation.mutate()}
                    whileTap={{ scale: 0.97 }}
                    disabled={syncMutation.isPending}
                    style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)',
                        background: 'transparent', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer',
                    }}
                >
                    <IconRefresh size={13} />
                    {syncMutation.isPending ? 'Syncing…' : 'Sync from GitHub'}
                </motion.button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Commit activity, PR throughput, review time, and AI usage for this repository. Commit/PR data reflects
                the last sync — click &quot;Sync from GitHub&quot; for the latest.
            </p>

            {loading && (
                <div style={{ width: 200, marginBottom: 20 }}>
                    <TraceLine active tone="ember" />
                </div>
            )}

            {!loading && (
                <>
                    <motion.div
                        initial="initial" animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                        className="grid-4"
                        style={{ marginBottom: 20 }}
                    >
                        <MetricCard index={0} label="Commits (30d)" value={commitsQuery.data?.totalCommits ?? 0} />
                        <MetricCard index={1} label="Open PRs" value={prsQuery.data?.openCount ?? 0} />
                        <MetricCard index={2} label="Avg time to merge" value={avgMergeHours != null ? `${avgMergeHours.toFixed(1)}h` : '—'} />
                        <MetricCard index={3} label="AI messages" value={aiUsageQuery.data?.messageCount ?? 0} />
                        <MetricCard index={4} label="Merged PRs" value={prsQuery.data?.mergedCount ?? 0} />
                        <MetricCard index={5} label="Closed PRs" value={prsQuery.data?.closedCount ?? 0} />
                        <MetricCard index={6} label="AI reviews run" value={reviewQuery.data?.totalReviews ?? 0} />
                        <MetricCard index={7} label="Avg review turnaround" value={avgTurnaroundMin != null ? `${avgTurnaroundMin}m` : '—'} />
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                        <Card title="Commit activity (30 days)">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={commitsQuery.data?.byDay ?? []}>
                                    <defs>
                                        <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false}
                                           tickFormatter={(d) => d.slice(5)} interval={4} />
                                    <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="count" stroke="var(--signal)" fill="url(#commitFill)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>

                        <Card title="Findings by severity">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={reviewQuery.data?.findingsBySeverity ?? []}>
                                    <XAxis dataKey="severity" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {(reviewQuery.data?.findingsBySeverity ?? []).map((entry) => (
                                            <Cell key={entry.severity} fill={SEVERITY_COLOR[entry.severity] ?? 'var(--text-muted)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <Card title="Top contributors (30 days)">
                            {commitsQuery.data?.topContributors?.length === 0 && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No commits synced yet.</p>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {commitsQuery.data?.topContributors?.map((c) => (
                                    <div key={c.login} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <IconGitCommit size={13} color="var(--text-muted)" />
                                        <span style={{ fontSize: 13 }}>{c.login}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{c.count} commits</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Recent pull requests">
                            {prsQuery.data?.recent?.length === 0 && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No pull requests synced yet.</p>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {prsQuery.data?.recent?.map((pr) => (
                                    <div key={pr.number} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <IconGitPullRequest size={13} color={pr.state === 'MERGED' ? 'var(--signal)' : pr.state === 'CLOSED' ? 'var(--text-muted)' : 'var(--ember)'} />
                                        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                      #{pr.number} {pr.title}
                    </span>
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{pr.state}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </PageContainer>
    );
}
