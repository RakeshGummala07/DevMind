import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconBrandGithub, IconStar, IconGitFork, IconPlus, IconLock, IconRefresh, IconSearch, IconFolderPlus, IconCircleCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { m } from '../components/Motion.jsx';
import { fadeUp, stagger, transitions } from '../utils/motionTokens.js';
import { apiErrorMessage } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { GITHUB_OAUTH_START_URL } from '../config/env.js';
import {
    listConnectedRepositories,
    listAvailableRepositories,
    connectRepository,
    requestIndexing,
} from '../features/repositories/repositoriesApi.js';

function ConnectedRepoCard({ repo, index, onIndex, indexing }) {
    const isIndexing = repo.indexingStatus === 'INDEXING';

    return (
        <m.li
            variants={fadeUp}
            transition={{ ...transitions.base, delay: index * stagger.list }}
            className="card card--interactive repo-card"
        >
            <div className="repo-card__head">
                <h3 className="mono repo-card__name">
                    {/* Stretched link: the whole card is clickable, and it's a real, keyboard-focusable link. */}
                    <Link to={`/repositories/${repo.id}`} className="repo-card__link">{repo.fullName}</Link>
                </h3>
                {repo.isPrivate && <IconLock size={14} aria-label="Private repository" className="muted-icon" />}
            </div>
            {repo.description && <p className="repo-card__desc">{repo.description}</p>}
            <div className="meta-row">
                {repo.primaryLanguage && <span>{repo.primaryLanguage}</span>}
                <span className="meta-row__item"><IconStar size={13} aria-hidden="true" /> {repo.starsCount}<span className="sr-only"> stars</span></span>
                <span className="meta-row__item"><IconGitFork size={13} aria-hidden="true" /> {repo.forksCount}<span className="sr-only"> forks</span></span>
                <span className="meta-row__end"><StatusBadge status={repo.indexingStatus} /></span>
            </div>

            <div className="repo-card__action">
                {isIndexing ? (
                    <TraceLine active tone="ember" label={`Indexing ${repo.fullName}`} />
                ) : (
                    <Button
                        variant="secondary"
                        size="sm"
                        block
                        icon={IconRefresh}
                        onClick={() => onIndex(repo.id)}
                        loading={indexing}
                        aria-label={`${repo.indexingStatus === 'COMPLETED' ? 'Re-index' : 'Index'} ${repo.fullName}`}
                    >
                        {repo.indexingStatus === 'COMPLETED' ? 'Re-index' : 'Index now'}
                    </Button>
                )}
            </div>
        </m.li>
    );
}

function AvailableRepoRow({ repo, index, onConnect, connecting, disabled }) {
    return (
        <m.li
            variants={fadeUp}
            transition={{ ...transitions.base, delay: Math.min(index, 12) * stagger.list }}
            className="available-row"
        >
            <div className="available-row__text">
                <div className="mono available-row__name">{repo.fullName}</div>
                {repo.description && <div className="available-row__desc">{repo.description}</div>}
            </div>
            <Button
                variant="secondary"
                size="sm"
                icon={IconPlus}
                loading={connecting}
                disabled={disabled}
                onClick={() => onConnect(repo.fullName)}
                aria-label={`Connect ${repo.fullName}`}
            >
                {connecting ? 'Connecting…' : 'Connect'}
            </Button>
        </m.li>
    );
}

export default function RepositoriesPage() {
    usePageTitle('Repositories');
    const queryClient = useQueryClient();
    const toast = useToast();
    const [connectingFullName, setConnectingFullName] = useState(null);
    const [indexingId, setIndexingId] = useState(null);
    const [filter, setFilter] = useState('');

    const connectedQuery = useQuery({
        queryKey: ['repositories', 'connected'],
        queryFn: listConnectedRepositories,
        // Poll while anything is actively indexing, so status flips to
        // COMPLETED/FAILED on its own once ingestion-service reports back —
        // otherwise the user would have to manually refresh to see it finish.
        refetchInterval: (query) =>
            query.state.data?.some((repo) => repo.indexingStatus === 'INDEXING') ? 3000 : false,
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
        onSuccess: (_data, fullName) => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            toast.success(`Connected ${fullName}. Index it to start asking questions.`);
        },
        onError: (error, fullName) => toast.error(apiErrorMessage(error, `Could not connect ${fullName}. Try again in a moment.`)),
    });

    const indexMutation = useMutation({
        mutationFn: requestIndexing,
        onMutate: (id) => setIndexingId(id),
        onSettled: () => setIndexingId(null),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories', 'connected'] });
            toast.success('Indexing started. Status updates here automatically.');
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'Could not start indexing. Try again in a moment.')),
    });

    const githubNotConnected = availableQuery.isError
        && availableQuery.error?.response?.data?.error?.code === 'GITHUB_NOT_CONNECTED';

    const handleGitHubConnect = () => {
        window.location.href = GITHUB_OAUTH_START_URL;
    };

    const available = useMemo(
        () => (availableQuery.data ?? []).filter((repo) => !repo.alreadyConnected),
        [availableQuery.data]
    );
    const visibleAvailable = useMemo(() => {
        const q = filter.trim().toLowerCase();
        return q ? available.filter((r) => r.fullName.toLowerCase().includes(q)) : available;
    }, [available, filter]);

    return (
        <PageContainer>
            <PageHeader
                title="Repositories"
                description="Connect a GitHub repository to index it and start asking questions grounded in real source."
            />

            <section aria-labelledby="connected-heading">
                <h2 id="connected-heading" className="section-title">Connected</h2>

                {connectedQuery.isLoading && (
                    <LoadingRegion label="Loading repositories">
                        <div className="repo-grid">
                            {[0, 1, 2].map((i) => (
                                <div className="card" key={i}>
                                    <Skeleton width="60%" height={16} />
                                    <Skeleton width="90%" height={12} style={{ marginTop: 14 }} />
                                    <Skeleton width="40%" height={12} style={{ marginTop: 20 }} />
                                </div>
                            ))}
                        </div>
                    </LoadingRegion>
                )}

                {connectedQuery.isError && (
                    <ErrorState
                        title="Couldn’t load your repositories"
                        message="Check your connection and try again."
                        onRetry={() => connectedQuery.refetch()}
                        retrying={connectedQuery.isFetching}
                    />
                )}

                {connectedQuery.data?.length > 0 && (
                    <m.ul
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.list } } }}
                        className="repo-grid"
                    >
                        {connectedQuery.data.map((repo, i) => (
                            <ConnectedRepoCard
                                key={repo.id}
                                repo={repo}
                                index={i}
                                onIndex={indexMutation.mutate}
                                indexing={indexingId === repo.id}
                            />
                        ))}
                    </m.ul>
                )}

                {connectedQuery.data?.length === 0 && !connectedQuery.isLoading && (
                    <EmptyState
                        compact
                        icon={IconFolderPlus}
                        title="No repositories connected yet"
                        description="Pick one from your GitHub account below to get started."
                    />
                )}
            </section>

            <section aria-labelledby="available-heading" className="section-gap">
                <div className="section-head">
                    <h2 id="available-heading" className="section-title">Connect from GitHub</h2>
                    {available.length > 5 && (
                        <div className="search-box">
                            <IconSearch size={15} aria-hidden="true" />
                            <input
                                className="search-box__input"
                                type="search"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Filter repositories"
                                aria-label="Filter your GitHub repositories"
                            />
                        </div>
                    )}
                </div>

                {githubNotConnected && (
                    <EmptyState
                        icon={IconBrandGithub}
                        title="Connect your GitHub account"
                        description="Link GitHub to browse your repositories and index them."
                        action={<Button icon={IconBrandGithub} onClick={handleGitHubConnect}>Connect GitHub</Button>}
                    />
                )}

                {availableQuery.isLoading && (
                    <LoadingRegion label="Loading your GitHub repositories">
                        <div className="available-list">
                            {[0, 1, 2].map((i) => (
                                <div className="available-row" key={i}>
                                    <div style={{ flex: 1 }}>
                                        <Skeleton width="35%" height={14} />
                                        <Skeleton width="60%" height={11} style={{ marginTop: 8 }} />
                                    </div>
                                    <Skeleton width={84} height={32} radius={6} />
                                </div>
                            ))}
                        </div>
                    </LoadingRegion>
                )}

                {availableQuery.isError && !githubNotConnected && (
                    <ErrorState
                        compact
                        title="Couldn’t load your GitHub repositories"
                        message="Try again shortly."
                        onRetry={() => availableQuery.refetch()}
                        retrying={availableQuery.isFetching}
                    />
                )}

                {availableQuery.data && available.length === 0 && (
                    <EmptyState
                        compact
                        icon={IconCircleCheck}
                        title={availableQuery.data.length === 0 ? 'No repositories found on your GitHub account' : 'Every repository is already connected'}
                    />
                )}

                {visibleAvailable.length > 0 && (
                    <m.ul
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: stagger.list } } }}
                        className="available-list"
                    >
                        {visibleAvailable.map((repo, i) => (
                            <AvailableRepoRow
                                key={repo.githubRepoId}
                                repo={repo}
                                index={i}
                                onConnect={connectMutation.mutate}
                                connecting={connectingFullName === repo.fullName}
                                disabled={connectMutation.isPending && connectingFullName !== repo.fullName}
                            />
                        ))}
                    </m.ul>
                )}

                {available.length > 0 && visibleAvailable.length === 0 && (
                    <p className="muted-text">No repositories match “{filter}”.</p>
                )}
            </section>
        </PageContainer>
    );
}
