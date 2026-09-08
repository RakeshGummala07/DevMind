package com.devmind.notificationservice.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Document(collection = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    /** Notification types the user has muted — nothing is created for a muted type. */
    private Set<NotificationType> mutedTypes = EnumSet.noneOf(NotificationType.class);

    public static NotificationPreference createDefault(String userId) {
        NotificationPreference pref = new NotificationPreference();
        pref.id = UUID.randomUUID().toString();
        pref.userId = userId;
        pref.mutedTypes = EnumSet.noneOf(NotificationType.class);
        return pref;
    }
}
