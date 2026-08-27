package com.devmind.repositoryservice.event;

import java.time.Instant;
import java.util.UUID;

public record RepositoryEvent(
        String eventId,
        String eventType,
        String repositoryId,
        String githubFullName,
        String defaultBranch,
        String connectedByUserId,
        Instant occurredAt
) {
    public static RepositoryEvent of(
            String eventType, String repositoryId, String githubFullName,
            String defaultBranch, String connectedByUserId
    ) {
        return new RepositoryEvent(
                UUID.randomUUID().toString(), eventType, repositoryId,
                githubFullName, defaultBranch, connectedByUserId, Instant.now());
    }
}
