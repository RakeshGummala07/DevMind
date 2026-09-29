import { useParams, Link } from 'react-router-dom';
import { IconMessageCircle, IconSearch, IconGitPullRequest, IconChartBar, IconFileText, IconArrowRight } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import { m } from '../components/Motion.jsx';
import { useRepository } from '../features/repositories/useRepository.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';

const TOOLS = [
  { to: 'chat', label: 'Chat', Icon: IconMessageCircle, blurb: 'Ask questions and get answers that cite the exact files they came from.' },
  { to: 'search', label: 'Semantic search', Icon: IconSearch, blurb: 'Find code by meaning, ranked by relevance to the indexed source.' },
  { to: 'pull-requests', label: 'Pull requests', Icon: IconGitPullRequest, blurb: 'Request an AI review of any open PR and see findings by severity.' },
  { to: 'analytics', label: 'Analytics', Icon: IconChartBar, blurb: 'Commit activity, PR throughput, review time and AI usage.' },
  { to: 'documentation', label: 'Documentation', Icon: IconFileText, blurb: 'Generate README, architecture, API and onboarding docs.' },
];

export default function RepositoryDetailPage() {
  const { id } = useParams();
  const { data: repo } = useRepository(id);
  usePageTitle(repo?.fullName ?? 'Repository');

  const status = repo?.indexingStatus;

  return (
    <PageContainer bare>
      {repo && (
        <div className="card note" role="status">
          {status === 'COMPLETED' ? (
            <p>
              This repository is indexed. Open <strong>Chat</strong> or <strong>Search</strong> to ask questions grounded in its source.
            </p>
          ) : status === 'FAILED' ? (
            <p>
              The last indexing attempt failed. Try <strong>Re-index</strong>; if it keeps failing, ask an administrator to check the ingestion service logs.
            </p>
          ) : status === 'INDEXING' ? (
            <p>Indexing is in progress. Chat, search and reviews unlock as soon as it completes.</p>
          ) : (
            <p>
              Index this repository to enable chat, search, and AI review grounded in its actual source. Use <strong>Index now</strong> above.
            </p>
          )}
        </div>
      )}

      <m.ul
        className="tool-grid"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: stagger.list } } }}
      >
        {TOOLS.map(({ to, label, Icon, blurb }) => (
          <m.li key={to} variants={fadeUp} transition={transitions.base}>
            <Link to={`/repositories/${id}/${to}`} className="card card--interactive tool">
              <span className="tool__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="tool__body">
                <span className="tool__title">{label}</span>
                <span className="tool__text">{blurb}</span>
              </span>
              <IconArrowRight size={16} className="tool__arrow" aria-hidden="true" />
            </Link>
          </m.li>
        ))}
      </m.ul>
    </PageContainer>
  );
}
