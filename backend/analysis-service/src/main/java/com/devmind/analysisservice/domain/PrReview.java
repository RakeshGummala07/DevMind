package com.devmind.analysisservice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pr_reviews")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrReview {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "repository_id", nullable = false, columnDefinition = "CHAR(36)")
    private String repositoryId;

    @Column(name = "pr_number", nullable = false)
    private int prNumber;

    @Column(name = "pr_title", length = 512)
    private String prTitle;

    @Column(name = "head_sha", length = 64)
    private String headSha;

    @Column(name = "base_sha", length = 64)
    private String baseSha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "files_reviewed", nullable = false)
    private int filesReviewed;

    @Column(name = "findings_count", nullable = false)
    private int findingsCount;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "error_message", length = 2048)
    private String errorMessage;

    @Column(name = "requested_by_user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String requestedByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public static PrReview start(String repositoryId, int prNumber, String requestedByUserId) {
        PrReview review = new PrReview();
        review.id = UUID.randomUUID().toString();
        review.repositoryId = repositoryId;
        review.prNumber = prNumber;
        review.requestedByUserId = requestedByUserId;
        review.status = ReviewStatus.PENDING;
        review.createdAt = Instant.now();
        return review;
    }

    public void markRunning(String prTitle, String headSha, String baseSha) {
        this.prTitle = prTitle;
        this.headSha = headSha;
        this.baseSha = baseSha;
        this.status = ReviewStatus.RUNNING;
    }

    public void markCompleted(int filesReviewed, int findingsCount, String summary) {
        this.status = ReviewStatus.COMPLETED;
        this.filesReviewed = filesReviewed;
        this.findingsCount = findingsCount;
        this.summary = summary;
        this.completedAt = Instant.now();
    }

    public void markFailed(String errorMessage) {
        this.status = ReviewStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }
}
