package com.devmind.ingestionservice.event;

import java.time.Instant;
import java.util.UUID;

public record IndexEvent(
        String eventId,
        String eventType,
        String repositoryId,
        String githubFullName,
        String defaultBranch,
        String connectedByUserId,
        Instant occurredAt
) {
    public static IndexEvent of(String eventType, IndexEvent source) {
        return new IndexEvent(
                UUID.randomUUID().toString(), eventType, source.repositoryId(),
                source.githubFullName(), source.defaultBranch(), source.connectedByUserId(), Instant.now());
    }
}
