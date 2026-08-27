package com.devmind.repositoryservice.event;

import com.devmind.repositoryservice.domain.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class RepositoryEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RepositoryEventPublisher.class);

    public static final String TOPIC_REPOSITORY_CREATED = "repository.created";
    public static final String TOPIC_INDEX_REQUESTED = "repository.index.requested";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public RepositoryEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishRepositoryCreated(Repository repo) {
        publish(TOPIC_REPOSITORY_CREATED, event("repository.created", repo));
    }

    /** Consumed by ingestion-service in Phase 4 — carries everything needed to clone and index the repo. */
    public void publishIndexRequested(Repository repo) {
        publish(TOPIC_INDEX_REQUESTED, event("repository.index.requested", repo));
    }

    private RepositoryEvent event(String eventType, Repository repo) {
        return RepositoryEvent.of(
                eventType, repo.getId(), repo.getFullName(), repo.getDefaultBranch(), repo.getConnectedByUserId());
    }

    private void publish(String topic, RepositoryEvent event) {
        try {
            CompletableFuture<SendResult<String, Object>> future =
                    kafkaTemplate.send(topic, event.repositoryId(), event);

            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    log.warn("Failed to publish {} for repository {} (Kafka may be unavailable): {}",
                            topic, event.repositoryId(), ex.getMessage());
                } else {
                    log.info("Published {} for repository {} (eventId={})", topic, event.repositoryId(), event.eventId());
                }
            });
        } catch (Exception e) {
            log.warn("Could not publish {} for repository {} — Kafka is unavailable, continuing without it: {}",
                    topic, event.repositoryId(), e.getMessage());
        }
    }
}
