import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { IconGitPullRequest, IconArrowRight, IconFolderPlus } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { m } from '../components/Motion.jsx';
import { transitions, stagger } from '../utils/motionTokens.js';
import { formatDate } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';
import { getReviewHistory } from '../features/reviews/reviewsApi.js';

const STATUS_TONE = {
  PENDING: 'neutral',
  RUNNING: 'ember',
  COMPLETED: 'signal',
  FAILED: 'critical',
};

export default function ReviewsPage() {
  usePageTitle('Reviews');
  const reposQuery = useQuery({
    queryKey: ['repositories'],
    queryFn: listConnectedRepositories,
  });

  const repos = reposQuery.data ?? [];


  const historyQueries = useQueries({
    queries: repos.map((repo) => ({
      queryKey: ['reviews', repo.id, 'history'],
      queryFn: () => getReviewHistory(repo.id),
      enabled: repos.length > 0,
    })),
  });

  const loadingHistories = historyQueries.some((q) => q.isLoading);
  const failedHistories = historyQueries.filter((q) => q.isError);

  const allReviews = repos
      .flatMap((repo, i) => {
        const reviews = historyQueries[i]?.data ?? [];
        return reviews.map((review) => ({ ...review, repoFullName: repo.fullName, repoId: repo.id }));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
      <PageContainer>
        <PageHeader title="Reviews" description="AI pull-request reviews across every connected repository." />

        {(reposQuery.isLoading || loadingHistories) && (
          <LoadingRegion label="Loading reviews">
            <ul className="plain-list plain-list--gap">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="review-row">
                  <Skeleton width="100%" height={16} />
                </li>
              ))}
            </ul>
          </LoadingRegion>
        )}

        {reposQuery.isError && (
          <ErrorState
            title="Couldn’t load your repositories"
            message="Reviews are listed per repository, so that list is needed first."
            onRetry={() => reposQuery.refetch()}
            retrying={reposQuery.isFetching}
          />
        )}

        {failedHistories.length > 0 && !loadingHistories && (
          <div className="form-error" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Reviews for some repositories couldn’t be loaded.</span>
            <Button variant="secondary" size="sm" onClick={() => failedHistories.forEach((q) => q.refetch())}>Retry</Button>
          </div>
        )}

        {!reposQuery.isLoading && !reposQuery.isError && repos.length === 0 && (
          <EmptyState
            icon={IconFolderPlus}
            title="Connect a repository first"
            description="Then request reviews from its Pull requests tab."
            action={<Button to="/repositories" icon={IconFolderPlus}>Connect a repository</Button>}
          />
        )}

        {!loadingHistories && repos.length > 0 && allReviews.length === 0 && failedHistories.length === 0 && (
          <EmptyState
            icon={IconGitPullRequest}
            title="No reviews yet"
            description="Open a repository’s Pull requests tab and request a review of an open PR."
            action={<Button to={`/repositories/${repos[0].id}/pull-requests`} icon={IconGitPullRequest}>Go to pull requests</Button>}
          />
        )}

        <ul className="plain-list plain-list--gap">
          {allReviews.map((review, i) => (
              <m.li
                  key={review.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.base, delay: Math.min(i, 12) * stagger.list }}
              >
                <Link to={`/repositories/${review.repoId}/pull-requests`} className="card card--interactive card--tight review-row">
                  <IconGitPullRequest size={16} aria-hidden="true" className="muted-icon" />
                  <code className="mono review-row__repo">{review.repoFullName}</code>
                  <span className="review-row__pr">PR #{review.prNumber}</span>
                  <Badge tone={STATUS_TONE[review.status] ?? 'neutral'} className="review-row__status">
                    {review.status === 'COMPLETED' ? `${review.findingsCount} finding(s)` : review.status}
                  </Badge>
                  <span className="review-row__date">{formatDate(review.createdAt)}</span>
                  <IconArrowRight size={14} aria-hidden="true" className="muted-icon" />
                </Link>
              </m.li>
          ))}
        </ul>
      </PageContainer>
  );
}
