import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconBrandGithub, IconStar, IconGitFork, IconPlus, IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import {
  listConnectedRepositories,
  listAvailableRepositories,
  connectRepository,
} from '../features/repositories/repositoriesApi.js';

const STATUS_TONE = {
  IDLE: { label: 'Not indexed', color: 'var(--text-muted)' },
  INDEXING: { label: 'Indexing…', color: 'var(--ember)' },
  COMPLETED: { label: 'Indexed', color: 'var(--signal)' },
  FAILED: { label: 'Indexing failed', color: 'var(--critical)' },
};

function ConnectedRepoCard({ repo, index }) {
  const navigate = useNavigate();
  const status = STATUS_TONE[repo.indexingStatus] ?? STATUS_TONE.IDLE;

  return (
    <motion.div
      variants={fadeUp}
      transition={{ ...transitions.base, delay: index * stagger.list }}
      onClick={() => navigate(`/repositories/${repo.id}`)}
      style={{
        padding: 18,
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--surface-1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>{repo.fullName}</div>
        {repo.isPrivate && <IconLock size={14} color="var(--text-muted)" />}
      </div>
      {repo.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{repo.description}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        {repo.primaryLanguage && <span>{repo.primaryLanguage}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconStar size={13} /> {repo.starsCount}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconGitFork size={13} /> {repo.forksCount}
        </span>
        <span style={{ marginLeft: 'auto', color: status.color }}>{status.label}</span>
      </div>
    </motion.div>
  );
}

function AvailableRepoRow({ repo, index, onConnect, connecting }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ ...transitions.base, delay: index * stagger.list }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        marginBottom: 8,
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{repo.fullName}</div>
        {repo.description && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{repo.description}</div>
        )}
      </div>
      <Button
        variant="secondary"
        style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onConnect(repo.fullName)}
      >
        <IconPlus size={14} />
        {connecting ? 'Connecting…' : 'Connect'}
      </Button>
    </motion.div>
  );
}

export default function RepositoriesPage() {
  const queryClient = useQueryClient();
  const [connectingFullName, setConnectingFullName] = useState(null);

  const connectedQuery = useQuery({
    queryKey: ['repositories', 'connected'],
    queryFn: listConnectedRepositories,
  });

  const availableQuery = useQuery({
    queryKey: ['repositories', 'available'],
    queryFn: listAvailableRepositories,
    retry: false, // a 400 here just means "GitHub not connected" — retrying won't help
  });

  const connectMutation = useMutation({
    mutationFn: connectRepository,
    onMutate: (fullName) => setConnectingFullName(fullName),
    onSettled: () => setConnectingFullName(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });

  const githubNotConnected = availableQuery.isError
    && availableQuery.error?.response?.data?.error?.code === 'GITHUB_NOT_CONNECTED';

  const handleGitHubConnect = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'}/api/auth/oauth/github`;
  };

  return (
    <PageContainer>
      <h1 style={{ marginBottom: 4 }}>Repositories</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Connect a GitHub repository to index it and start asking questions grounded in real source.
      </p>

      {connectedQuery.isLoading && (
        <div style={{ width: 240, marginBottom: 28 }}>
          <TraceLine active tone="ember" />
        </div>
      )}

      {connectedQuery.data?.length > 0 && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: stagger.list } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 36 }}
        >
          {connectedQuery.data.map((repo, i) => (
            <ConnectedRepoCard key={repo.id} repo={repo} index={i} />
          ))}
        </motion.div>
      )}

      {connectedQuery.data?.length === 0 && !connectedQuery.isLoading && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
          No repositories connected yet — pick one from GitHub below.
        </p>
      )}

      <h3 style={{ marginBottom: 12 }}>Connect from GitHub</h3>

      {githubNotConnected && (
        <div
          style={{
            padding: 20,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Connect your GitHub account to browse and index your repositories.
          </span>
          <Button
            onClick={handleGitHubConnect}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <IconBrandGithub size={16} />
            Connect GitHub
          </Button>
        </div>
      )}

      {availableQuery.isLoading && (
        <div style={{ width: 200 }}>
          <TraceLine active tone="signal" />
        </div>
      )}

      {availableQuery.isError && !githubNotConnected && (
        <p style={{ color: 'var(--critical)', fontSize: 13 }}>
          Could not load your GitHub repositories. Try again shortly.
        </p>
      )}

      {availableQuery.data?.length > 0 && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: stagger.list } } }}
        >
          {availableQuery.data
            .filter((repo) => !repo.alreadyConnected)
            .map((repo, i) => (
              <AvailableRepoRow
                key={repo.githubRepoId}
                repo={repo}
                index={i}
                onConnect={connectMutation.mutate}
                connecting={connectingFullName === repo.fullName}
              />
            ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
