package com.devmind.repositoryservice.service;

import com.devmind.repositoryservice.client.AuthServiceClient;
import com.devmind.repositoryservice.client.GithubApiClient;
import com.devmind.repositoryservice.client.GithubApiClient.GithubCommitSummary;
import com.devmind.repositoryservice.client.GithubApiClient.PullRequestLifecycle;
import com.devmind.repositoryservice.domain.PullRequestState;
import com.devmind.repositoryservice.domain.RepoCommit;
import com.devmind.repositoryservice.domain.RepoPullRequest;
import com.devmind.repositoryservice.domain.Repository;
import com.devmind.repositoryservice.exception.AppException;
import com.devmind.repositoryservice.repository.RepoCommitRepository;
import com.devmind.repositoryservice.repository.RepoPullRequestRepository;
import com.devmind.repositoryservice.repository.RepositoryJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Pulls commits and PR lifecycle straight from GitHub and upserts into repo_commits /
 * repo_pull_requests. This is the one part of Phase 8 that's genuinely new data collection —
 * everything else in the analytics dashboard aggregates data other phases already collect.
 *
 * Synchronous, like the PR-picker fetch — two GitHub API calls (commits, PRs), each capped at
 * 100 results (GitHub's single-page max), so it stays fast enough for a direct request/response.
 * Real limitation, not hidden: repos with >100 commits or >100 PRs since last sync will only get
 * the most recent 100 of each — no pagination loop implemented yet.
 */
@Service
public class RepoAnalyticsSyncService {

    private static final Logger log = LoggerFactory.getLogger(RepoAnalyticsSyncService.class);

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final RepoCommitRepository commitRepository;
    private final RepoPullRequestRepository pullRequestRepository;
    private final AuthServiceClient authServiceClient;
    private final GithubApiClient githubApiClient;

    public RepoAnalyticsSyncService(
            RepositoryJpaRepository repositoryJpaRepository,
            RepoCommitRepository commitRepository,
            RepoPullRequestRepository pullRequestRepository,
            AuthServiceClient authServiceClient,
            GithubApiClient githubApiClient
    ) {
        this.repositoryJpaRepository = repositoryJpaRepository;
        this.commitRepository = commitRepository;
        this.pullRequestRepository = pullRequestRepository;
        this.authServiceClient = authServiceClient;
        this.githubApiClient = githubApiClient;
    }

    public record SyncResult(int newCommits, int syncedPullRequests) {}

    public SyncResult sync(String repositoryId) {
        Repository repo = repositoryJpaRepository.findById(repositoryId)
                .orElseThrow(() -> AppException.notFound("REPOSITORY_NOT_FOUND", "Repository was not found"));

        String token = authServiceClient.getGithubToken(repo.getConnectedByUserId()).githubAccessToken();

        int newCommits = syncCommits(repo, token);
        int syncedPrs = syncPullRequests(repo, token);

        log.info("Analytics sync for repo {}: {} new commits, {} PRs synced", repositoryId, newCommits, syncedPrs);
        return new SyncResult(newCommits, syncedPrs);
    }

    private int syncCommits(Repository repo, String token) {
        var commits = githubApiClient.listCommits(token, repo.getOwner(), repo.getName());
        int inserted = 0;

        for (GithubCommitSummary c : commits) {
            if (c.sha().isBlank() || commitRepository.existsByRepositoryIdAndSha(repo.getId(), c.sha())) {
                continue; // commits are immutable once made — skip anything we've already stored
            }
            Instant committedAt = parseInstant(c.committedAt());
            if (committedAt == null) continue;

            commitRepository.save(RepoCommit.of(repo.getId(), c.sha(), c.authorLogin(), c.authorName(), c.message(), committedAt));
            inserted++;
        }
        return inserted;
    }

    private int syncPullRequests(Repository repo, String token) {
        var lifecycles = githubApiClient.listPullRequestLifecycles(token, repo.getOwner(), repo.getName());
        int synced = 0;

        for (PullRequestLifecycle pr : lifecycles) {
            Instant openedAt = parseInstant(pr.createdAt());
            if (openedAt == null) continue;

            Instant closedAt = parseInstant(pr.closedAt());
            Instant mergedAt = parseInstant(pr.mergedAt());
            PullRequestState state = mergedAt != null ? PullRequestState.MERGED
                    : "closed".equalsIgnoreCase(pr.state()) ? PullRequestState.CLOSED
                    : PullRequestState.OPEN;

            pullRequestRepository.findByRepositoryIdAndPrNumber(repo.getId(), pr.number())
                    .ifPresentOrElse(
                            existing -> {
                                existing.applySync(pr.title(), state, closedAt, mergedAt);
                                pullRequestRepository.save(existing);
                            },
                            () -> pullRequestRepository.save(RepoPullRequest.create(
                                    repo.getId(), pr.number(), pr.title(), state, pr.authorLogin(), openedAt, closedAt, mergedAt))
                    );
            synced++;
        }
        return synced;
    }

    private Instant parseInstant(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return Instant.parse(iso);
        } catch (Exception e) {
            log.warn("Could not parse timestamp '{}' from GitHub response", iso);
            return null;
        }
    }
}
