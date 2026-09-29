import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { IconArrowRight, IconFolderPlus } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/Button.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { SkeletonCard, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getPullRequestSummary, getAiUsage, getReviewSummary } from '../features/analytics/analyticsApi.js';

function MetricCard({ label, value, index }) {
  return (
      <m.div
          variants={fadeUp}
          transition={{ ...transitions.base, delay: index * stagger.dashboard }}
          className="card stat"
      >
        <div className="stat__value"><CountUp value={value} /></div>
        <div className="stat__label">{label}</div>
      </m.div>
  );
}

export default function AnalyticsPage() {
  usePageTitle('Analytics');
  const reposQuery = useQuery({ queryKey: ['repositories'], queryFn: listConnectedRepositories });
  // Memoized so this doesn't get a new array identity every render when reposQuery.data
  // is still undefined (loading) — otherwise the useMemo below that depends on `repos`
  // would recompute every render instead of only when the actual data changes.
  const repos = useMemo(() => reposQuery.data ?? [], [reposQuery.data]);

  // Fan out three lightweight summary calls per repo, mirroring ReviewsPage's cross-repo
  // stitching — there's no cross-repository aggregate endpoint on any service yet, so this
  // combines each repo's own summary endpoints client-side.
  const prQueries = useQueries({
    queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'prs'], queryFn: () => getPullRequestSummary(r.id), enabled: repos.length > 0 })),
  });
  const aiQueries = useQueries({
    queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'ai-usage'], queryFn: () => getAiUsage(r.id), enabled: repos.length > 0 })),
  });
  const reviewQueries = useQueries({
    queries: repos.map((r) => ({ queryKey: ['analytics', r.id, 'reviews'], queryFn: () => getReviewSummary(r.id), enabled: repos.length > 0 })),
  });

  const loading = reposQuery.isLoading || prQueries.some((q) => q.isLoading) || aiQueries.some((q) => q.isLoading) || reviewQueries.some((q) => q.isLoading);
  const partialError = [prQueries, aiQueries, reviewQueries].some((qs) => qs.some((q) => q.isError));

  const perRepo = useMemo(() => repos.map((repo, i) => ({
    repo,
    pr: prQueries[i]?.data,
    ai: aiQueries[i]?.data,
    review: reviewQueries[i]?.data,
  })), [repos, prQueries, aiQueries, reviewQueries]);

  const totals = useMemo(() => perRepo.reduce((acc, r) => ({
    openPrs: acc.openPrs + (r.pr?.openCount ?? 0),
    mergedPrs: acc.mergedPrs + (r.pr?.mergedCount ?? 0),
    aiMessages: acc.aiMessages + (r.ai?.messageCount ?? 0),
    reviews: acc.reviews + (r.review?.totalReviews ?? 0),
    findings: acc.findings + (r.review?.findingsBySeverity?.reduce((s, f) => s + f.count, 0) ?? 0),
  }), { openPrs: 0, mergedPrs: 0, aiMessages: 0, reviews: 0, findings: 0 }), [perRepo]);

  return (
      <PageContainer>
        <PageHeader
          title="Engineering analytics"
          description="Cross-repository PR throughput, AI review activity, and AI usage. Commit and PR numbers reflect each repository’s last GitHub sync — open a repository’s own analytics tab to sync it."
        />

        {reposQuery.isError && (
          <ErrorState
            title="Couldn’t load your repositories"
            onRetry={() => reposQuery.refetch()}
            retrying={reposQuery.isFetching}
          />
        )}

        {loading && !reposQuery.isError && (
          <LoadingRegion label="Loading analytics">
            <div className="stats-grid">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}</div>
          </LoadingRegion>
        )}

        {!reposQuery.isLoading && !reposQuery.isError && repos.length === 0 && (
          <EmptyState
            icon={IconFolderPlus}
            title="Connect a repository first"
            description="Analytics appear once a repository is connected and synced."
            action={<Button to="/repositories" icon={IconFolderPlus}>Connect a repository</Button>}
          />
        )}

        {!loading && repos.length > 0 && (
            <>
              {partialError && (
                <div className="form-error" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Some figures couldn’t be loaded, so totals may be incomplete.</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => [prQueries, aiQueries, reviewQueries].forEach((qs) => qs.forEach((q) => q.isError && q.refetch()))}
                  >
                    Retry
                  </Button>
                </div>
              )}

              <m.div
                  initial="initial" animate="animate"
                  variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                  className="stats-grid"
              >
                <MetricCard index={0} label="Open PRs (all repos)" value={totals.openPrs} />
                <MetricCard index={1} label="Merged PRs (all repos)" value={totals.mergedPrs} />
                <MetricCard index={2} label="AI reviews run" value={totals.reviews} />
                <MetricCard index={3} label="AI chat messages" value={totals.aiMessages} />
              </m.div>

              <h2 className="section-title section-gap">By repository</h2>
              <ul className="plain-list plain-list--gap">
                {perRepo.map(({ repo, pr, ai, review }, i) => (
                    <m.li
                        key={repo.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transitions.base, delay: Math.min(i, 12) * stagger.list }}
                    >
                      <Link to={`/repositories/${repo.id}/analytics`} className="card card--interactive card--tight repo-stats-row">
                        <code className="mono repo-stats-row__name">{repo.fullName}</code>
                        <span>{pr?.openCount ?? 0} open PRs</span>
                        <span>{review?.totalReviews ?? 0} AI reviews</span>
                        <span>{ai?.messageCount ?? 0} chat messages</span>
                        <IconArrowRight size={14} aria-hidden="true" className="muted-icon repo-stats-row__arrow" />
                      </Link>
                    </m.li>
                ))}
              </ul>
            </>
        )}
      </PageContainer>
  );
}
