package com.devmind.notificationservice.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record IndexEvent(
        String eventId, String eventType, String repositoryId,
        String githubFullName, String defaultBranch, String connectedByUserId, Instant occurredAt
) {}
