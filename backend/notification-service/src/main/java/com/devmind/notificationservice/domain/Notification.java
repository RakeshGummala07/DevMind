package com.devmind.notificationservice.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private NotificationType type;
    private String title;
    private String message;

    private String repositoryId;

    private boolean read;
    private Instant createdAt;

    public static Notification create(String userId, NotificationType type, String title, String message, String repositoryId) {
        Notification notification = new Notification();
        notification.id = UUID.randomUUID().toString();
        notification.userId = userId;
        notification.type = type;
        notification.title = title;
        notification.message = message;
        notification.repositoryId = repositoryId;
        notification.read = false;
        notification.createdAt = Instant.now();
        return notification;
    }

    public void markRead() {
        this.read = true;
    }
}
