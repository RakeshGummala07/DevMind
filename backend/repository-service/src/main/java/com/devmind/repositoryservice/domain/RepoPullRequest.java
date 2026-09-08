package com.devmind.repositoryservice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A GitHub pull request's raw lifecycle (opened/closed/merged), synced directly from GitHub.
 * Distinct from analysis-service's PrReview, which tracks *our* AI review runs against a PR,
 * not the PR's own GitHub state.
 */
@Entity
@Table(name = "repo_pull_requests")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RepoPullRequest {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "repository_id", nullable = false, columnDefinition = "CHAR(36)")
    private String repositoryId;

    @Column(name = "pr_number", nullable = false)
    private int prNumber;

    @Column(length = 512)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PullRequestState state;

    @Column(name = "author_login")
    private String authorLogin;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "merged_at")
    private Instant mergedAt;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;

    public static RepoPullRequest create(
            String repositoryId, int prNumber, String title, PullRequestState state,
            String authorLogin, Instant openedAt, Instant closedAt, Instant mergedAt
    ) {
        RepoPullRequest pr = new RepoPullRequest();
        pr.id = UUID.randomUUID().toString();
        pr.repositoryId = repositoryId;
        pr.prNumber = prNumber;
        pr.title = title;
        pr.state = state;
        pr.authorLogin = authorLogin;
        pr.openedAt = openedAt;
        pr.closedAt = closedAt;
        pr.mergedAt = mergedAt;
        pr.syncedAt = Instant.now();
        return pr;
    }

    /** Applies fresh GitHub state onto an already-persisted row (state can change: open -> merged/closed). */
    public void applySync(String title, PullRequestState state, Instant closedAt, Instant mergedAt) {
        this.title = title;
        this.state = state;
        this.closedAt = closedAt;
        this.mergedAt = mergedAt;
        this.syncedAt = Instant.now();
    }
}
