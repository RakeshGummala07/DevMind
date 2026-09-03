package com.devmind.notificationservice.dto;

import com.devmind.notificationservice.domain.Notification;

import java.time.Instant;

public record NotificationDto(
        String id, String type, String title, String message,
        String repositoryId, boolean read, Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(), n.getType().name(), n.getTitle(), n.getMessage(),
                n.getRepositoryId(), n.isRead(), n.getCreatedAt()
        );
    }
}
