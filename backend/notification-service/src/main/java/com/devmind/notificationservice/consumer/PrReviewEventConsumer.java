package com.devmind.notificationservice.consumer;

import com.devmind.notificationservice.event.PrReviewCompletedEvent;
import com.devmind.notificationservice.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PrReviewEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(PrReviewEventConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public PrReviewEventConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "pr.review.completed", groupId = "${spring.kafka.consumer.group-id}")
    public void onReviewCompleted(String payload) {
        PrReviewCompletedEvent event;
        try {
            event = objectMapper.readValue(payload, PrReviewCompletedEvent.class);
        } catch (Exception e) {
            log.error("Could not parse PrReviewCompletedEvent payload: {}", e.getMessage());
            return;
        }

        boolean succeeded = "COMPLETED".equals(event.status());
        notificationService.createReviewNotification(
                event.requestedByUserId(), succeeded, event.repositoryId(), event.prNumber(), event.findingsCount());

        log.info("Notification created for review {} ({}): PR #{}", event.status(), event.requestedByUserId(), event.prNumber());
    }
}
