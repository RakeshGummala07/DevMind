import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconGitPullRequest, IconArrowRight } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getReviewHistory } from '../features/reviews/reviewsApi.js';

const STATUS_COLOR = {
  PENDING: 'var(--text-muted)',
  RUNNING: 'var(--ember)',
  COMPLETED: 'var(--signal)',
  FAILED: 'var(--critical)',
};

export default function ReviewsPage() {
  const reposQuery = useQuery({
    queryKey: ['repositories'],
    queryFn: listConnectedRepositories,
  });

  const repos = reposQuery.data ?? [];

  // One review-history call per connected repo, run in parallel — there's no
  // cross-repository "all my reviews" endpoint on analysis-service yet, so
  // this stitches the per-repo endpoint together client-side instead.
  const historyQueries = useQueries({
    queries: repos.map((repo) => ({
      queryKey: ['reviews', repo.id, 'history'],
      queryFn: () => getReviewHistory(repo.id),
      enabled: repos.length > 0,
    })),
  });

  const loadingHistories = historyQueries.some((q) => q.isLoading);

  const allReviews = repos
      .flatMap((repo, i) => {
        const reviews = historyQueries[i]?.data ?? [];
        return reviews.map((review) => ({ ...review, repoFullName: repo.fullName, repoId: repo.id }));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
      <PageContainer>
        <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.base}>
          <h2 style={{ marginBottom: 4 }}>Reviews</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            AI pull-request reviews across every connected repository.
          </p>

          {(reposQuery.isLoading || loadingHistories) && (
              <div style={{ width: 200, marginBottom: 20 }}>
                <TraceLine active tone="ember" />
              </div>
          )}

          {!reposQuery.isLoading && repos.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Connect a repository first, then request reviews from its Pull requests tab.
              </p>
          )}

          {!loadingHistories && repos.length > 0 && allReviews.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No reviews yet. Open a repository's Pull requests tab to request one.
              </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allReviews.map((review, i) => (
                <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transitions.base, delay: i * stagger.list }}
                >
                  <Link
                      to={`/repositories/${review.repoId}/pull-requests`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--surface-1)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                      }}
                  >
                    <IconGitPullRequest size={16} color="var(--text-muted)" />
                    <code className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {review.repoFullName}
                    </code>
                    <span style={{ fontSize: 13 }}>PR #{review.prNumber}</span>
                    <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          color: STATUS_COLOR[review.status] ?? 'var(--text-muted)',
                        }}
                    >
                  {review.status === 'COMPLETED'
                      ? `${review.findingsCount} finding(s)`
                      : review.status}
                </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 90, textAlign: 'right' }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                    <IconArrowRight size={14} color="var(--text-muted)" />
                  </Link>
                </motion.div>
            ))}
          </div>
        </motion.div>
      </PageContainer>
  );
}
