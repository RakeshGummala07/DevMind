import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IconStar, IconGitFork, IconLock, IconExternalLink, IconRefresh,
  IconMessageCircle, IconSearch, IconGitPullRequest, IconChartBar, IconFileText,
} from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
import { getRepository, requestIndexing } from '../features/repositories/repositoriesApi.js';

const STATUS_TONE = {
  IDLE: { label: 'Not indexed', color: 'var(--text-muted)' },
  INDEXING: { label: 'Indexing…', color: 'var(--ember)' },
  COMPLETED: { label: 'Indexed', color: 'var(--signal)' },
  FAILED: { label: 'Indexing failed', color: 'var(--critical)' },
};

// These navigate to sibling top-level routes (see App.jsx) rather than nested
// children — there's no shared tab chrome across them yet, so leaving this
// page after clicking one is expected, not a bug.
const TABS = [
  { to: 'chat', label: 'Chat', Icon: IconMessageCircle },
  { to: 'search', label: 'Search', Icon: IconSearch },
  { to: 'pull-requests', label: 'Pull requests', Icon: IconGitPullRequest },
  { to: 'analytics', label: 'Analytics', Icon: IconChartBar },
  { to: 'documentation', label: 'Docs', Icon: IconFileText },
];

export default function RepositoryDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const repoQuery = useQuery({
    queryKey: ['repositories', id],
    queryFn: () => getRepository(id),
    refetchInterval: (query) => (query.state.data?.indexingStatus === 'INDEXING' ? 3000 : false),
  });

  const indexMutation = useMutation({
    mutationFn: () => requestIndexing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories', id] }),
  });

  if (repoQuery.isLoading) {
    return (
        <PageContainer>
          <div style={{ width: 240 }}>
            <TraceLine active tone="ember" />
          </div>
        </PageContainer>
    );
  }

  if (repoQuery.isError) {
    return (
        <PageContainer>
          <p style={{ color: 'var(--critical)', fontSize: 14 }}>
            Could not load this repository. It may not exist, or you may not have access to it.
          </p>
        </PageContainer>
    );
  }

  const repo = repoQuery.data;
  const status = STATUS_TONE[repo.indexingStatus] ?? STATUS_TONE.IDLE;
  const isIndexing = repo.indexingStatus === 'INDEXING';

  return (
      <PageContainer>
        <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.base}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22 }}>{repo.fullName}</h1>
                {repo.isPrivate && <IconLock size={16} color="var(--text-muted)" />}
                <a href={repo.htmlUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                  <IconExternalLink size={16} />
                </a>
              </div>
              {repo.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{repo.description}</p>
              )}
            </div>

            {!isIndexing && (
                <button
                    onClick={() => indexMutation.mutate()}
                    disabled={indexMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', fontSize: 13, borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-strong)', background: 'transparent',
                      color: 'var(--text-primary)', cursor: indexMutation.isPending ? 'default' : 'pointer',
                    }}
                >
                  <IconRefresh size={14} />
                  {repo.indexingStatus === 'COMPLETED' ? 'Re-index' : 'Index now'}
                </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {repo.primaryLanguage && <span>{repo.primaryLanguage}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconStar size={14} /> {repo.starsCount}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconGitFork size={14} /> {repo.forksCount}</span>
            <span>Branch: <code className="mono">{repo.defaultBranch}</code></span>
            <span style={{ color: status.color, marginLeft: 'auto' }}>{status.label}</span>
          </div>

          {isIndexing && (
              <div style={{ marginBottom: 20 }}>
                <TraceLine active tone="ember" />
              </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {TABS.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', fontSize: 13, textDecoration: 'none',
                      color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                >
                  <Icon size={14} />
                  {label}
                </NavLink>
            ))}
          </div>

          <div
              style={{
                padding: 20,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface-1)',
                color: 'var(--text-secondary)',
                fontSize: 13,
              }}
          >
            {repo.indexingStatus === 'COMPLETED' ? (
                <p>
                  This repository is indexed. Use the <strong>Chat</strong> or <strong>Search</strong> links
                  above to ask questions grounded in its source — once Phase 5 wires those pages up to real
                  retrieval instead of today's simulated response.
                </p>
            ) : repo.indexingStatus === 'FAILED' ? (
                <p>The last indexing attempt failed. Check <code className="mono">ingestion-service</code> logs, then try Re-index.</p>
            ) : (
                <p>Index this repository to enable chat, search, and AI review grounded in its actual source.</p>
            )}
          </div>
        </motion.div>
      </PageContainer>
  );
}