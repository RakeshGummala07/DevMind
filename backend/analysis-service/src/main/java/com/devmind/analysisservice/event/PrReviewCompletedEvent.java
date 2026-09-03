package com.devmind.analysisservice.event;

import java.time.Instant;
import java.util.UUID;

public record PrReviewCompletedEvent(
        String eventId, String eventType, String reviewId, String repositoryId,
        int prNumber, String status, int findingsCount, String requestedByUserId, Instant occurredAt
) {
    public static PrReviewCompletedEvent of(
            String reviewId, String repositoryId, int prNumber,
            String status, int findingsCount, String requestedByUserId
    ) {
        return new PrReviewCompletedEvent(
                UUID.randomUUID().toString(), "pr.review.completed", reviewId, repositoryId,
                prNumber, status, findingsCount, requestedByUserId, Instant.now()
        );
    }
}
