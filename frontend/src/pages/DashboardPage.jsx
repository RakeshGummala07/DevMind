import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { IconFolderPlus, IconArrowRight, IconGitPullRequest } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/Button.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import Badge from '../components/ui/Badge.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, SkeletonCard, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { ChartFrame, chartTooltipStyle, useChartAnimation } from '../components/ui/Chart.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { formatDate } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getPullRequestSummary, getReviewSummary, getCommitActivity } from '../features/analytics/analyticsApi.js';
import { getReviewHistory } from '../features/reviews/reviewsApi.js';

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const REVIEW_TONE = { COMPLETED: 'signal', RUNNING: 'ember', PENDING: 'neutral', FAILED: 'critical' };

export default function DashboardPage() {
    usePageTitle('Dashboard');
    const animateChart = useChartAnimation();
    const reposQuery = useQuery({ queryKey: ['repositories'], queryFn: listConnectedRepositories });
    const repos = useMemo(() => reposQuery.data ?? [], [reposQuery.data]);


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

    const partialError = [prQueries, reviewSummaryQueries, reviewHistoryQueries, commitQueries].some((qs) => qs.some((q) => q.isError));
    const refetchAll = () => [prQueries, reviewSummaryQueries, reviewHistoryQueries, commitQueries].forEach((qs) => qs.forEach((q) => q.isError && q.refetch()));

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
            { label: 'Repositories connected', value: repos.length },
            { label: 'Open pull requests', value: openPRs },
            { label: 'AI reviews this week', value: reviewsThisWeek },
            { label: 'Avg. review time', value: avgReviewTimeLabel },
        ];
    }, [repos, prQueries, reviewSummaryQueries, reviewHistoryQueries]);


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

    const totalCommits = activity.reduce((s, d) => s + d.commits, 0);

    // Latest reviews across every repository, from data already fetched above.
    const recentReviews = useMemo(
        () =>
            repos
                .flatMap((repo, i) => (reviewHistoryQueries[i]?.data ?? []).map((review) => ({ ...review, repo })))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
        [repos, reviewHistoryQueries]
    );

    return (
        <PageContainer>
            <PageHeader title="Dashboard" description="Engineering activity across every connected repository." />

            {reposQuery.isError && (
                <ErrorState
                    title="Couldn’t load your repositories"
                    message="Your dashboard needs your repository list first. Check your connection and try again."
                    onRetry={() => reposQuery.refetch()}
                    retrying={reposQuery.isFetching}
                />
            )}

            {loading && !reposQuery.isError && (
                <LoadingRegion label="Loading dashboard">
                    <div className="stats-grid">
                        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}
                    </div>
                    <div className="card" style={{ marginTop: 24 }}>
                        <Skeleton width={140} height={16} style={{ marginBottom: 20 }} />
                        <Skeleton height={200} radius={8} />
                    </div>
                </LoadingRegion>
            )}

            {!reposQuery.isLoading && !reposQuery.isError && repos.length === 0 && (
                <EmptyState
                    icon={IconFolderPlus}
                    title="Connect your first repository"
                    description="Once a repository is connected and indexed, its activity, reviews and AI usage show up here."
                    action={<Button to="/repositories" icon={IconFolderPlus}>Connect a repository</Button>}
                />
            )}

            {!loading && repos.length > 0 && (
                <>
                    {partialError && (
                        <div className="form-error" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Some figures couldn’t be loaded, so totals may be incomplete.</span>
                            <Button variant="secondary" size="sm" onClick={refetchAll}>Retry</Button>
                        </div>
                    )}

                    <m.div
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                        className="stats-grid"
                    >
                        {metrics.map((metric) => (
                            <m.div key={metric.label} variants={fadeUp} transition={transitions.base} className="card stat">
                                <div className="stat__value"><CountUp value={metric.value} /></div>
                                <div className="stat__label">{metric.label}</div>
                            </m.div>
                        ))}
                    </m.div>

                    <m.section
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        transition={{ ...transitions.base, delay: stagger.dashboard * metrics.length }}
                        className="card section-gap"
                        aria-labelledby="commit-activity"
                    >
                        <div className="card__title-row">
                            <h2 id="commit-activity">Commit activity</h2>
                            <span className="card__meta">Last 7 days</span>
                        </div>
                        <ChartFrame label="Commit activity, last 7 days" summary={`${totalCommits} commits across all repositories in the last 7 days.`}>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={activity} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'var(--border-strong)' }} />
                                    <Area type="monotone" dataKey="commits" stroke="var(--signal)" fill="url(#commitFill)" strokeWidth={2} isAnimationActive={animateChart} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartFrame>
                    </m.section>

                    <div className="two-col section-gap">
                        <section className="card" aria-labelledby="dash-repos">
                            <div className="card__title-row">
                                <h2 id="dash-repos">Repositories</h2>
                                <Link to="/repositories" className="card__link">View all <IconArrowRight size={14} aria-hidden="true" /></Link>
                            </div>
                            <ul className="plain-list">
                                {repos.slice(0, 5).map((repo) => (
                                    <li key={repo.id}>
                                        <Link to={`/repositories/${repo.id}`} className="list-row">
                                            <span className="mono list-row__main">{repo.fullName}</span>
                                            <StatusBadge status={repo.indexingStatus} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="card" aria-labelledby="dash-reviews">
                            <div className="card__title-row">
                                <h2 id="dash-reviews">Recent AI reviews</h2>
                                <Link to="/reviews" className="card__link">View all <IconArrowRight size={14} aria-hidden="true" /></Link>
                            </div>
                            {recentReviews.length === 0 ? (
                                <p className="muted-text">No reviews yet. Request one from a repository’s Pull requests tab.</p>
                            ) : (
                                <ul className="plain-list">
                                    {recentReviews.map((review) => (
                                        <li key={review.id}>
                                            <Link to={`/repositories/${review.repo.id}/pull-requests`} className="list-row">
                                                <IconGitPullRequest size={15} aria-hidden="true" className="list-row__icon" />
                                                <span className="list-row__main">
                                                    <span className="mono list-row__sub">{review.repo.fullName}</span> PR #{review.prNumber}
                                                </span>
                                                <Badge tone={REVIEW_TONE[review.status] ?? 'neutral'}>
                                                    {review.status === 'COMPLETED' ? `${review.findingsCount} finding(s)` : review.status}
                                                </Badge>
                                                <span className="list-row__date">{formatDate(review.createdAt)}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </>
            )}
        </PageContainer>
    );
}
