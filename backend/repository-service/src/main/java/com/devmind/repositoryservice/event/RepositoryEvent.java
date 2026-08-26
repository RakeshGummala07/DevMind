package com.devmind.repositoryservice.event;

import java.time.Instant;
import java.util.UUID;

/** Common envelope for every event this service publishes — gives every consumer an id + correlation id to log/trace by. */
public record RepositoryEvent(
        String eventId,
        String eventType,
        String repositoryId,
        String githubFullName,
        Instant occurredAt
) {
    public static RepositoryEvent of(String eventType, String repositoryId, String githubFullName) {
        return new RepositoryEvent(UUID.randomUUID().toString(), eventType, repositoryId, githubFullName, Instant.now());
    }
}
