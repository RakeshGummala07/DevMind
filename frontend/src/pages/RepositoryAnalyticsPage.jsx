import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { IconRefresh, IconGitCommit, IconGitPullRequest } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import { Skeleton, SkeletonCard, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { ChartFrame, chartTooltipStyle, useChartAnimation } from '../components/ui/Chart.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { apiErrorMessage } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import {
    syncRepositoryAnalytics, getCommitActivity, getPullRequestSummary, getAiUsage, getReviewSummary,
} from '../features/analytics/analyticsApi.js';

const SEVERITY_COLOR = { CRITICAL: 'var(--critical)', MAJOR: 'var(--high)', MINOR: 'var(--medium)', INFO: 'var(--info)' };

function MetricCard({ label, value, index }) {
    return (
        <m.div
            variants={fadeUp}
            transition={{ ...transitions.base, delay: index * stagger.dashboard }}
            className="card card--tight stat stat--sm"
        >
            <div className="stat__value"><CountUp value={value} /></div>
            <div className="stat__label">{label}</div>
        </m.div>
    );
}

function Card({ title, children }) {
    return (
        <section className="card" aria-label={title}>
            <h3 className="card__title">{title}</h3>
            {children}
        </section>
    );
}

export default function RepositoryAnalyticsPage() {
    usePageTitle('Repository analytics');
    const animateChart = useChartAnimation();
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const toast = useToast();

    const commitsQuery = useQuery({ queryKey: ['analytics', repositoryId, 'commits'], queryFn: () => getCommitActivity(repositoryId, 30) });
    const prsQuery = useQuery({ queryKey: ['analytics', repositoryId, 'prs'], queryFn: () => getPullRequestSummary(repositoryId) });
    const aiUsageQuery = useQuery({ queryKey: ['analytics', repositoryId, 'ai-usage'], queryFn: () => getAiUsage(repositoryId) });
    const reviewQuery = useQuery({ queryKey: ['analytics', repositoryId, 'reviews'], queryFn: () => getReviewSummary(repositoryId) });

    const syncMutation = useMutation({
        mutationFn: () => syncRepositoryAnalytics(repositoryId),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['analytics', repositoryId] });
            const commits = result?.newCommits;
            toast.success(commits != null ? `Sync complete — ${commits} new commit(s) found.` : 'Sync complete.');
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'Sync from GitHub failed. Try again in a moment.')),
    });

    const queries = [commitsQuery, prsQuery, aiUsageQuery, reviewQuery];
    const loading = queries.some((q) => q.isLoading);
    const failed = queries.filter((q) => q.isError);

    const avgMergeHours = prsQuery.data?.avgTimeToMergeHours;
    const avgTurnaroundMin = reviewQuery.data?.avgTurnaroundSeconds != null ? (reviewQuery.data.avgTurnaroundSeconds / 60).toFixed(1) : null;
    const byDay = commitsQuery.data?.byDay ?? [];
    const findings = reviewQuery.data?.findingsBySeverity ?? [];

    return (
        <PageContainer bare>
            <div className="sub-head">
                <h2 className="sub-title">Repository analytics</h2>
                <Button variant="secondary" size="sm" icon={IconRefresh} onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
                    {syncMutation.isPending ? 'Syncing…' : 'Sync from GitHub'}
                </Button>
            </div>
            <p className="sub-lead">
                Commit activity, PR throughput, review time, and AI usage for this repository. Commit and PR data reflects
                the last sync — click &quot;Sync from GitHub&quot; for the latest.
            </p>

            {loading && (
                <LoadingRegion label="Loading analytics">
                    <div className="stats-grid stats-grid--dense">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
                    </div>
                    <div className="two-col section-gap">
                        <div className="card"><Skeleton height={200} radius={8} /></div>
                        <div className="card"><Skeleton height={200} radius={8} /></div>
                    </div>
                </LoadingRegion>
            )}

            {!loading && failed.length > 0 && (
                <div className="form-error" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{failed.length === queries.length ? 'Analytics couldn’t be loaded.' : 'Some analytics couldn’t be loaded.'}</span>
                    <Button variant="secondary" size="sm" onClick={() => failed.forEach((q) => q.refetch())}>Retry</Button>
                </div>
            )}

            {!loading && failed.length < queries.length && (
                <>
                    <m.div
                        initial="initial" animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                        className="stats-grid stats-grid--dense"
                    >
                        <MetricCard index={0} label="Commits (30d)" value={commitsQuery.data?.totalCommits ?? 0} />
                        <MetricCard index={1} label="Open PRs" value={prsQuery.data?.openCount ?? 0} />
                        <MetricCard index={2} label="Avg time to merge" value={avgMergeHours != null ? `${avgMergeHours.toFixed(1)}h` : '—'} />
                        <MetricCard index={3} label="AI messages" value={aiUsageQuery.data?.messageCount ?? 0} />
                        <MetricCard index={4} label="Merged PRs" value={prsQuery.data?.mergedCount ?? 0} />
                        <MetricCard index={5} label="Closed PRs" value={prsQuery.data?.closedCount ?? 0} />
                        <MetricCard index={6} label="AI reviews run" value={reviewQuery.data?.totalReviews ?? 0} />
                        <MetricCard index={7} label="Avg review turnaround" value={avgTurnaroundMin != null ? `${avgTurnaroundMin}m` : '—'} />
                    </m.div>

                    <div className="two-col section-gap">
                        <Card title="Commit activity (30 days)">
                            <ChartFrame label="Commit activity over 30 days" summary={`${commitsQuery.data?.totalCommits ?? 0} commits in the last 30 days.`}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={byDay} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}
                                               tickFormatter={(d) => d.slice(5)} interval={4} />
                                        <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'var(--border-strong)' }} />
                                        <Area type="monotone" dataKey="count" stroke="var(--signal)" fill="url(#commitFill)" strokeWidth={2} isAnimationActive={animateChart} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                        </Card>

                        <Card title="Findings by severity">
                            <ChartFrame
                                label="Review findings by severity"
                                summary={findings.length ? findings.map((f) => `${f.severity}: ${f.count}`).join(', ') : 'No findings yet.'}
                            >
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={findings} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <XAxis dataKey="severity" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={animateChart}>
                                            {findings.map((entry) => (
                                                <Cell key={entry.severity} fill={SEVERITY_COLOR[entry.severity] ?? 'var(--text-muted)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                        </Card>
                    </div>

                    <div className="two-col section-gap">
                        <Card title="Top contributors (30 days)">
                            {commitsQuery.data?.topContributors?.length === 0 && (
                                <p className="muted-text">No commits synced yet. Use “Sync from GitHub” above.</p>
                            )}
                            <ul className="plain-list plain-list--gap-sm">
                                {commitsQuery.data?.topContributors?.map((c) => (
                                    <li key={c.login} className="list-row list-row--static">
                                        <IconGitCommit size={14} aria-hidden="true" className="muted-icon" />
                                        <span className="list-row__main">{c.login}</span>
                                        <span className="list-row__date">{c.count} commits</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <Card title="Recent pull requests">
                            {prsQuery.data?.recent?.length === 0 && (
                                <p className="muted-text">No pull requests synced yet. Use “Sync from GitHub” above.</p>
                            )}
                            <ul className="plain-list plain-list--gap-sm">
                                {prsQuery.data?.recent?.map((pr) => (
                                    <li key={pr.number} className="list-row list-row--static">
                                        <IconGitPullRequest size={14} aria-hidden="true" color={pr.state === 'MERGED' ? 'var(--signal)' : pr.state === 'CLOSED' ? 'var(--text-muted)' : 'var(--ember)'} />
                                        <span className="list-row__main list-row__ellipsis">#{pr.number} {pr.title}</span>
                                        <Badge tone={pr.state === 'MERGED' ? 'signal' : pr.state === 'OPEN' ? 'ember' : 'neutral'}>{pr.state}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </>
            )}
        </PageContainer>
    );
}
