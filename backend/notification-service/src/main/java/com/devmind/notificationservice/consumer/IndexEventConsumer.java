package com.devmind.notificationservice.consumer;

import com.devmind.notificationservice.event.IndexEvent;
import com.devmind.notificationservice.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class IndexEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(IndexEventConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public IndexEventConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"repository.index.completed", "repository.index.failed"}, groupId = "${spring.kafka.consumer.group-id}")
    public void onIndexEvent(String payload) {
        IndexEvent event;
        try {
            event = objectMapper.readValue(payload, IndexEvent.class);
        } catch (Exception e) {
            log.error("Could not parse IndexEvent payload: {}", e.getMessage());
            return;
        }

        boolean succeeded = "repository.index.completed".equals(event.eventType());
        notificationService.createIndexNotification(
                event.connectedByUserId(), succeeded, event.repositoryId(), event.githubFullName());

        log.info("Notification created for {} ({}): repo {}", event.eventType(), event.connectedByUserId(), event.repositoryId());
    }
}
