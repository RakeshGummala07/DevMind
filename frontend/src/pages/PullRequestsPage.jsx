import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { IconGitPullRequest, IconAlertTriangle, IconCircleCheck, IconExternalLink } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions, stagger } from '../utils/motionTokens.js';
import { triggerReview, getReview, getReviewHistory } from '../features/reviews/reviewsApi.js';
import { listPullRequests } from '../features/repositories/repositoriesApi.js';

const IN_PROGRESS_STATUSES = ['PENDING', 'RUNNING'];

const SEVERITY_STYLE = {
    CRITICAL: { color: 'var(--critical)', label: 'Critical' },
    MAJOR: { color: 'var(--high)', label: 'Major' },
    MINOR: { color: 'var(--medium)', label: 'Minor' },
    INFO: { color: 'var(--info)', label: 'Info' },
};

const STATUS_LABEL = {
    PENDING: 'Queued…',
    RUNNING: 'Reviewing…',
    COMPLETED: 'Reviewed',
    FAILED: 'Failed',
};

function FindingCard({ finding, index }) {
    const style = SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE.INFO;
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.base, delay: index * stagger.list }}
            style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
            style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                color: style.color,
            }}
        >
          {style.label}
        </span>
                <code className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {finding.filePath}
                    {finding.lineNumber ? `:${finding.lineNumber}` : ''}
                </code>
                <span
                    title={finding.grounded ? 'Backed by retrieved repository context' : 'Based on the diff alone — no matching indexed context found'}
                    style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: finding.grounded ? 'var(--signal)' : 'var(--text-muted)',
                        background: finding.grounded ? 'var(--signal-dim)' : 'transparent',
                        border: `1px solid ${finding.grounded ? 'var(--signal-dim)' : 'var(--border)'}`,
                    }}
                >
          {finding.grounded ? 'grounded' : 'diff-only'}
        </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{finding.message}</p>
        </motion.div>
    );
}

function ReviewDetail({ reviewId }) {
    const reviewQuery = useQuery({
        queryKey: ['reviews', 'detail', reviewId],
        queryFn: () => getReview(reviewId),
        enabled: !!reviewId,
        refetchInterval: (query) => (IN_PROGRESS_STATUSES.includes(query.state.data?.status) ? 2500 : false),
    });

    if (!reviewId) {
        return (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                Pick an open PR on the left and request a review.
            </div>
        );
    }

    if (reviewQuery.isLoading) {
        return (
            <div style={{ width: 200 }}>
                <TraceLine active tone="ember" />
            </div>
        );
    }

    if (reviewQuery.isError) {
        return <p style={{ color: 'var(--critical)', fontSize: 13 }}>Could not load this review.</p>;
    }

    const review = reviewQuery.data;
    const inProgress = IN_PROGRESS_STATUSES.includes(review.status);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>PR #{review.prNumber}</h3>
                {review.prTitle && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{review.prTitle}</span>}
                <span
                    style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        color: review.status === 'FAILED' ? 'var(--critical)' : review.status === 'COMPLETED' ? 'var(--signal)' : 'var(--ember)',
                    }}
                >
          {STATUS_LABEL[review.status] ?? review.status}
        </span>
            </div>

            {inProgress && (
                <div style={{ marginBottom: 16 }}>
                    <TraceLine active tone="ember" />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                        fetching diff, retrieving context, generating findings…
                    </p>
                </div>
            )}

            {review.status === 'FAILED' && (
                <div
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: 12, borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--critical)', background: 'transparent', marginBottom: 16,
                    }}
                >
                    <IconAlertTriangle size={16} color="var(--critical)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {review.errorMessage || 'The review failed for an unknown reason.'}
                    </p>
                </div>
            )}

            {review.status === 'COMPLETED' && (
                <>
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: 12, borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--surface-1)', marginBottom: 16,
                            fontSize: 13, color: 'var(--text-secondary)',
                        }}
                    >
                        {review.findingsCount === 0 ? (
                            <IconCircleCheck size={16} color="var(--signal)" />
                        ) : (
                            <IconAlertTriangle size={16} color="var(--ember)" />
                        )}
                        {review.summary}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <AnimatePresence>
                            {review.findings.map((finding, i) => (
                                <FindingCard key={`${finding.filePath}-${i}`} finding={finding} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}

export default function PullRequestsPage() {
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const [selectedReviewId, setSelectedReviewId] = useState(null);
    const [pendingPrNumber, setPendingPrNumber] = useState(null);

    const prsQuery = useQuery({
        queryKey: ['pull-requests', repositoryId],
        queryFn: () => listPullRequests(repositoryId),
    });

    const historyQuery = useQuery({
        queryKey: ['reviews', repositoryId, 'history'],
        queryFn: () => getReviewHistory(repositoryId),
    });


    const latestReviewByPr = useMemo(() => {
        const map = new Map();
        for (const review of historyQuery.data ?? []) {
            const existing = map.get(review.prNumber);
            if (!existing || new Date(review.createdAt) > new Date(existing.createdAt)) {
                map.set(review.prNumber, review);
            }
        }
        return map;
    }, [historyQuery.data]);

    const triggerMutation = useMutation({
        mutationFn: (prNumber) => triggerReview(repositoryId, prNumber),
        onMutate: (prNumber) => setPendingPrNumber(prNumber),
        onSuccess: (review) => {
            setSelectedReviewId(review.id);
            queryClient.invalidateQueries({ queryKey: ['reviews', repositoryId, 'history'] });
        },
        onSettled: () => setPendingPrNumber(null),
    });

    return (
        <PageContainer>
            <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.base}>
                <h2 style={{ marginBottom: 4 }}>Pull requests</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Request an AI review of any open PR. Findings grounded in this repository&apos;s indexed source are
                    marked <span style={{ color: 'var(--signal)' }}>grounded</span>; everything else is based on the
                    diff alone.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* Left: open PRs from GitHub */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {prsQuery.isLoading && (
                            <div style={{ width: 160 }}>
                                <TraceLine active tone="ember" />
                            </div>
                        )}

                        {prsQuery.isError && (
                            <p style={{ fontSize: 12, color: 'var(--critical)' }}>
                                Could not load open pull requests. Your GitHub connection may need to be refreshed.
                            </p>
                        )}

                        {prsQuery.data?.length === 0 && (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No open pull requests right now.</p>
                        )}

                        {prsQuery.data?.map((pr, i) => {
                            const latestReview = latestReviewByPr.get(pr.number);
                            const isTriggeringThis = triggerMutation.isPending && pendingPrNumber === pr.number;

                            return (
                                <motion.div
                                    key={pr.number}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...transitions.base, delay: i * stagger.list }}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1px solid ${selectedReviewId && latestReview?.id === selectedReviewId ? 'var(--border-strong)' : 'var(--border)'}`,
                                        background: 'var(--surface-1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{pr.title}</span>
                                        <a href={pr.htmlUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                            <IconExternalLink size={13} />
                                        </a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      #{pr.number} by {pr.authorLogin}
                    </span>

                                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {latestReview && (
                                                <button
                                                    onClick={() => setSelectedReviewId(latestReview.id)}
                                                    style={{
                                                        fontSize: 11,
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color:
                                                            latestReview.status === 'FAILED' ? 'var(--critical)'
                                                                : latestReview.status === 'COMPLETED' ? (latestReview.findingsCount > 0 ? 'var(--ember)' : 'var(--signal)')
                                                                    : 'var(--text-muted)',
                                                    }}
                                                >
                                                    {latestReview.status === 'COMPLETED'
                                                        ? `${latestReview.findingsCount} finding(s)`
                                                        : STATUS_LABEL[latestReview.status]}
                                                </button>
                                            )}
                                            <motion.button
                                                onClick={() => triggerMutation.mutate(pr.number)}
                                                whileTap={{ scale: 0.97 }}
                                                disabled={triggerMutation.isPending}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    padding: '5px 9px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--ember)',
                                                    background: isTriggeringThis ? 'transparent' : 'var(--ember)',
                                                    color: isTriggeringThis ? 'var(--ember)' : '#1a0e05',
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    cursor: triggerMutation.isPending ? 'default' : 'pointer',
                                                }}
                                            >
                                                <IconGitPullRequest size={12} />
                                                {latestReview ? 'Re-review' : 'Review'}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Right: selected review detail */}
                    <div
                        style={{
                            padding: 20,
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface-1)',
                            minHeight: 200,
                        }}
                    >
                        <ReviewDetail reviewId={selectedReviewId} />
                    </div>
                </div>
            </motion.div>
        </PageContainer>
    );
}
