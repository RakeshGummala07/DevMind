package com.devmind.notificationservice.repository;

import com.devmind.notificationservice.domain.NotificationPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {
    Optional<NotificationPreference> findByUserId(String userId);
}
