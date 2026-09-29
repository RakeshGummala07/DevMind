import { Suspense } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconStar, IconGitFork, IconLock, IconExternalLink, IconRefresh, IconLayoutList,
  IconMessageCircle, IconSearch, IconGitPullRequest, IconChartBar, IconFileText,
} from '@tabler/icons-react';
import Button from '../components/Button.jsx';
import PageFallback from '../components/PageFallback.jsx';
import TraceLine from '../components/TraceLine.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { requestIndexing } from '../features/repositories/repositoriesApi.js';
import { useRepository } from '../features/repositories/useRepository.js';
import { safeExternalUrl } from '../utils/safeUrl.js';
import { apiErrorMessage } from '../utils/format.js';

const TABS = [
  { to: '', label: 'Overview', Icon: IconLayoutList, end: true },
  { to: 'chat', label: 'Chat', Icon: IconMessageCircle },
  { to: 'search', label: 'Search', Icon: IconSearch },
  { to: 'pull-requests', label: 'Pull requests', Icon: IconGitPullRequest },
  { to: 'analytics', label: 'Analytics', Icon: IconChartBar },
  { to: 'documentation', label: 'Docs', Icon: IconFileText },
];

/**
 * Shared shell for every /repositories/:id/* route: repository identity,
 * indexing status + action, and tab navigation. Sub-pages render in <Outlet />.
 * Sub-pages stay usable even if the header request fails.
 */
export default function RepositoryLayout() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const repoQuery = useRepository(id);

  const indexMutation = useMutation({
    mutationFn: () => requestIndexing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories', id] });
      toast.success('Indexing started. Status updates here automatically.');
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not start indexing. Try again in a moment.')),
  });

  const repo = repoQuery.data;
  const isIndexing = repo?.indexingStatus === 'INDEXING';
  const htmlUrl = safeExternalUrl(repo?.htmlUrl);

  return (
    <div className="page-container">
      <div className="repo-head">
        {repoQuery.isLoading && (
          <div className="repo-head__skeleton" aria-hidden="true">
            <Skeleton width={280} height={26} />
            <Skeleton width={420} height={14} style={{ marginTop: 12 }} />
          </div>
        )}

        {repoQuery.isError && (
          <ErrorState
            compact
            title="Couldn’t load this repository’s details"
            message="It may not exist, or you may not have access to it."
            onRetry={() => repoQuery.refetch()}
            retrying={repoQuery.isFetching}
          />
        )}

        {repo && (
          <>
            <div className="repo-head__top">
              <div className="repo-head__id">
                <h1 className="mono repo-head__name">{repo.fullName}</h1>
                {repo.isPrivate && (
                  <span className="repo-head__lock" title="Private repository">
                    <IconLock size={16} aria-label="Private repository" />
                  </span>
                )}
                {htmlUrl && (
                  <a href={htmlUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={`Open ${repo.fullName} on GitHub (new tab)`}>
                    <IconExternalLink size={16} />
                  </a>
                )}
              </div>

              {!isIndexing && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={IconRefresh}
                  onClick={() => indexMutation.mutate()}
                  loading={indexMutation.isPending}
                >
                  {repo.indexingStatus === 'COMPLETED' ? 'Re-index' : 'Index now'}
                </Button>
              )}
            </div>

            {repo.description && <p className="repo-head__desc">{repo.description}</p>}

            <div className="meta-row">
              {repo.primaryLanguage && <span>{repo.primaryLanguage}</span>}
              <span className="meta-row__item"><IconStar size={14} aria-hidden="true" /> {repo.starsCount}<span className="sr-only"> stars</span></span>
              <span className="meta-row__item"><IconGitFork size={14} aria-hidden="true" /> {repo.forksCount}<span className="sr-only"> forks</span></span>
              <span>
                Branch: <code className="mono">{repo.defaultBranch}</code>
              </span>
              <span className="meta-row__end"><StatusBadge status={repo.indexingStatus} /></span>
            </div>

            {isIndexing && (
              <div className="repo-head__trace">
                <TraceLine active tone="ember" label="Indexing repository" />
              </div>
            )}
          </>
        )}

        <nav className="tabs" aria-label="Repository sections">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink key={label} to={to ? `/repositories/${id}/${to}` : `/repositories/${id}`} end={end} className={({ isActive }) => `tabs__link${isActive ? ' is-active' : ''}`}>
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Suspense fallback={<PageFallback inline />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
