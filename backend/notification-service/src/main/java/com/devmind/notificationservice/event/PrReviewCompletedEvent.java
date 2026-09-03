package com.devmind.notificationservice.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PrReviewCompletedEvent(
        String eventId, String eventType, String reviewId, String repositoryId,
        int prNumber, String status, int findingsCount, String requestedByUserId, Instant occurredAt
) {}
