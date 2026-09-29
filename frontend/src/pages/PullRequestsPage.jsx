import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconGitPullRequest, IconAlertTriangle, IconCircleCheck, IconExternalLink, IconPointer, IconGitMerge } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { m } from '../components/Motion.jsx';
import { transitions, stagger } from '../utils/motionTokens.js';
import { safeExternalUrl } from '../utils/safeUrl.js';
import { apiErrorMessage } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
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
        <m.li
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.base, delay: Math.min(index, 10) * stagger.list }}
            className="finding"
            style={{ '--sev': style.color }}
        >
            <div className="finding__head">
                <span className="finding__sev">{style.label}</span>
                <code className="mono finding__path">
                    {finding.filePath}
                    {finding.lineNumber ? `:${finding.lineNumber}` : ''}
                </code>
                <Badge
                    tone={finding.grounded ? 'signal' : 'neutral'}
                    title={finding.grounded ? 'Backed by retrieved repository context' : 'Based on the diff alone — no matching indexed context found'}
                    className="finding__badge"
                >
                    {finding.grounded ? 'grounded' : 'diff-only'}
                </Badge>
            </div>
            <p className="finding__msg">{finding.message}</p>
        </m.li>
    );
}

function ReviewDetail({ reviewId, repositoryId }) {
    const queryClient = useQueryClient();
    const reviewQuery = useQuery({
        queryKey: ['reviews', 'detail', reviewId],
        queryFn: () => getReview(reviewId),
        enabled: !!reviewId,
        refetchInterval: (query) => (IN_PROGRESS_STATUSES.includes(query.state.data?.status) ? 2500 : false),
    });

    // When a review finishes, refresh the PR list so its status label doesn't stay on "Reviewing…".
    const previousStatus = useRef(null);
    const status = reviewQuery.data?.status;
    useEffect(() => {
        if (previousStatus.current && IN_PROGRESS_STATUSES.includes(previousStatus.current) && status && !IN_PROGRESS_STATUSES.includes(status)) {
            queryClient.invalidateQueries({ queryKey: ['reviews', repositoryId, 'history'] });
        }
        previousStatus.current = status ?? null;
    }, [status, repositoryId, queryClient]);

    if (!reviewId) {
        return (
            <EmptyState
                compact
                icon={IconPointer}
                title="No review selected"
                description="Pick an open PR on the left and request a review, or open an earlier result."
            />
        );
    }

    if (reviewQuery.isLoading) {
        return (
            <LoadingRegion label="Loading review">
                <Skeleton width="45%" height={20} />
                <Skeleton width="100%" height={48} style={{ marginTop: 16 }} radius={8} />
                <Skeleton width="100%" height={64} style={{ marginTop: 12 }} radius={8} />
            </LoadingRegion>
        );
    }

    if (reviewQuery.isError) {
        return (
            <ErrorState
                compact
                title="Couldn’t load this review"
                message="Try again in a moment."
                onRetry={() => reviewQuery.refetch()}
                retrying={reviewQuery.isFetching}
            />
        );
    }

    const review = reviewQuery.data;
    const inProgress = IN_PROGRESS_STATUSES.includes(review.status);
    const tone = review.status === 'FAILED' ? 'critical' : review.status === 'COMPLETED' ? 'signal' : 'ember';

    return (
        <div>
            <div className="review__head">
                <h3 className="mono">PR #{review.prNumber}</h3>
                {review.prTitle && <span className="review__title">{review.prTitle}</span>}
                <Badge tone={tone} dot pulse={inProgress} className="review__status">
                    {STATUS_LABEL[review.status] ?? review.status}
                </Badge>
            </div>

            {inProgress && (
                <div className="review__progress" role="status">
                    <TraceLine active tone="ember" label="Review in progress" />
                    <p className="mono">fetching diff, retrieving context, generating findings…</p>
                </div>
            )}

            {review.status === 'FAILED' && (
                <div className="form-error" role="alert">
                    <IconAlertTriangle size={16} aria-hidden="true" />
                    <span>{review.errorMessage || 'The review failed for an unknown reason. Try requesting it again.'}</span>
                </div>
            )}

            {review.status === 'COMPLETED' && (
                <>
                    <div className={`review__summary${review.findingsCount === 0 ? ' is-clean' : ''}`}>
                        {review.findingsCount === 0 ? (
                            <IconCircleCheck size={18} aria-hidden="true" />
                        ) : (
                            <IconAlertTriangle size={18} aria-hidden="true" />
                        )}
                        <span>{review.summary}</span>
                    </div>

                    <ul className="findings">
                        {review.findings.map((finding, i) => (
                            <FindingCard key={`${finding.filePath}-${i}`} finding={finding} index={i} />
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default function PullRequestsPage() {
    usePageTitle('Pull requests');
    const { id: repositoryId } = useParams();
    const queryClient = useQueryClient();
    const toast = useToast();
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
            toast.success('Review requested. Findings appear here as soon as they’re ready.');
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'Could not request a review. Try again in a moment.')),
        onSettled: () => setPendingPrNumber(null),
    });

    return (
        <PageContainer bare>
            <h2 className="sub-title">Pull requests</h2>
            <p className="sub-lead">
                Request an AI review of any open PR. Findings grounded in this repository&apos;s indexed source are
                marked <Badge tone="signal">grounded</Badge>; everything else is based on the diff alone.
            </p>

            <div className="split">
                {/* Left: open PRs from GitHub */}
                <section aria-label="Open pull requests" className="split__side">
                    {prsQuery.isLoading && (
                        <LoadingRegion label="Loading pull requests">
                            {[0, 1, 2].map((i) => (
                                <div className="pr" key={i}>
                                    <Skeleton width="80%" height={14} />
                                    <Skeleton width="50%" height={11} style={{ marginTop: 10 }} />
                                </div>
                            ))}
                        </LoadingRegion>
                    )}

                    {prsQuery.isError && (
                        <ErrorState
                            compact
                            title="Couldn’t load open pull requests"
                            message="Your GitHub connection may need to be refreshed."
                            onRetry={() => prsQuery.refetch()}
                            retrying={prsQuery.isFetching}
                        />
                    )}

                    {prsQuery.data?.length === 0 && (
                        <EmptyState compact icon={IconGitMerge} title="No open pull requests" description="New PRs from GitHub show up here." />
                    )}

                    <ul className="plain-list plain-list--gap">
                        {prsQuery.data?.map((pr, i) => {
                            const latestReview = latestReviewByPr.get(pr.number);
                            const isTriggeringThis = triggerMutation.isPending && pendingPrNumber === pr.number;
                            const selected = !!selectedReviewId && latestReview?.id === selectedReviewId;
                            const prUrl = safeExternalUrl(pr.htmlUrl);

                            return (
                                <m.li
                                    key={pr.number}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...transitions.base, delay: Math.min(i, 10) * stagger.list }}
                                    className={`pr${selected ? ' is-selected' : ''}`}
                                >
                                    <div className="pr__top">
                                        <span className="pr__title">{pr.title}</span>
                                        {prUrl && (
                                            <a href={prUrl} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn--sm" aria-label={`Open PR #${pr.number} on GitHub (new tab)`}>
                                                <IconExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="pr__bottom">
                                        <span className="pr__meta">#{pr.number} by {pr.authorLogin}</span>

                                        <div className="pr__actions">
                                            {latestReview && (
                                                <button
                                                    type="button"
                                                    className={`pr__result${latestReview.status === 'FAILED' ? ' is-failed' : latestReview.status === 'COMPLETED' ? (latestReview.findingsCount > 0 ? ' is-findings' : ' is-clean') : ''}`}
                                                    onClick={() => setSelectedReviewId(latestReview.id)}
                                                    aria-label={`Show latest review of PR #${pr.number}`}
                                                >
                                                    {latestReview.status === 'COMPLETED'
                                                        ? `${latestReview.findingsCount} finding(s)`
                                                        : STATUS_LABEL[latestReview.status]}
                                                </button>
                                            )}
                                            <Button
                                                size="sm"
                                                icon={IconGitPullRequest}
                                                onClick={() => triggerMutation.mutate(pr.number)}
                                                loading={isTriggeringThis}
                                                disabled={triggerMutation.isPending}
                                                aria-label={`${latestReview ? 'Re-review' : 'Review'} PR #${pr.number}`}
                                            >
                                                {latestReview ? 'Re-review' : 'Review'}
                                            </Button>
                                        </div>
                                    </div>
                                </m.li>
                            );
                        })}
                    </ul>
                </section>

                {/* Right: selected review detail */}
                <section aria-label="Review details" aria-live="polite" className="card split__main">
                    <ReviewDetail reviewId={selectedReviewId} repositoryId={repositoryId} />
                </section>
            </div>
        </PageContainer>
    );
}
