import { Link, useLocation } from 'react-router-dom';
import { useRepository } from '../features/repositories/useRepository.js';

const TOP_LEVEL = {
  dashboard: 'Dashboard',
  repositories: 'Repositories',
  reviews: 'Reviews',
  analytics: 'Analytics',
  profile: 'Profile',
  settings: 'Settings',
};

const REPO_SECTION = {
  chat: 'Chat',
  search: 'Search',
  'pull-requests': 'Pull requests',
  analytics: 'Analytics',
  documentation: 'Documentation',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const repoId = segments[0] === 'repositories' ? segments[1] : undefined;
  // Shares the cache entry the repository pages use, so this is not an extra request in practice.
  const repoQuery = useRepository(repoId);

  const crumbs = [];
  if (segments[0] && TOP_LEVEL[segments[0]]) {
    crumbs.push({ label: TOP_LEVEL[segments[0]], to: `/${segments[0]}` });
  }
  if (repoId) {
    crumbs.push({ label: repoQuery.data?.fullName ?? 'Repository', to: `/repositories/${repoId}`, mono: true });
    const section = REPO_SECTION[segments[2]];
    if (section) crumbs.push({ label: section, to: pathname });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.to}>
              {last ? (
                <span aria-current="page" className={crumb.mono ? 'mono' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className={crumb.mono ? 'mono' : undefined}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
