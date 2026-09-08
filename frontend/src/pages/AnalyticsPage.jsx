import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getPullRequestSummary, getAiUsage, getReviewSummary } from '../features/analytics/analyticsApi.js';

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

export default function AnalyticsPage() {
  const reposQuery = useQuery({ queryKey: ['repositories'], queryFn: listConnectedRepositories });
  const repos = reposQuery.data ?? [];

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
        <h2 style={{ marginBottom: 4 }}>Engineering analytics</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Cross-repository PR throughput, AI review activity, and AI usage. Commit/PR numbers reflect each
          repository's last GitHub sync — open a repository's own analytics tab to sync it.
        </p>

        {loading && (
            <div style={{ width: 200, marginBottom: 20 }}>
              <TraceLine active tone="ember" />
            </div>
        )}

        {!reposQuery.isLoading && repos.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connect a repository first to see analytics.</p>
        )}

        {!loading && repos.length > 0 && (
            <>
              <motion.div
                  initial="initial" animate="animate"
                  variants={{ animate: { transition: { staggerChildren: stagger.dashboard } } }}
                  className="grid-4"
                  style={{ marginBottom: 24 }}
              >
                <MetricCard index={0} label="Open PRs (all repos)" value={totals.openPrs} />
                <MetricCard index={1} label="Merged PRs (all repos)" value={totals.mergedPrs} />
                <MetricCard index={2} label="AI reviews run" value={totals.reviews} />
                <MetricCard index={3} label="AI chat messages" value={totals.aiMessages} />
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {perRepo.map(({ repo, pr, ai, review }, i) => (
                    <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transitions.base, delay: i * stagger.list }}
                    >
                      <Link
                          to={`/repositories/${repo.id}/analytics`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--surface-1)',
                            textDecoration: 'none', color: 'var(--text-primary)',
                          }}
                      >
                        <code className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 200 }}>
                          {repo.fullName}
                        </code>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pr?.openCount ?? 0} open PRs</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{review?.totalReviews ?? 0} AI reviews</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ai?.messageCount ?? 0} chat messages</span>
                        <IconArrowRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                      </Link>
                    </motion.div>
                ))}
              </div>
            </>
        )}
      </PageContainer>
  );
}
