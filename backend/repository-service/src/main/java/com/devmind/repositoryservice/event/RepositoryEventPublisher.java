package com.devmind.repositoryservice.event;

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

    public void publishRepositoryCreated(String repositoryId, String fullName) {
        publish(TOPIC_REPOSITORY_CREATED, RepositoryEvent.of("repository.created", repositoryId, fullName));
    }

    /** Published when a user explicitly requests indexing — ingestion-service consumes this in Phase 4. */
    public void publishIndexRequested(String repositoryId, String fullName) {
        publish(TOPIC_INDEX_REQUESTED, RepositoryEvent.of("repository.index.requested", repositoryId, fullName));
    }

    private void publish(String topic, RepositoryEvent event) {
        // Publishing is deliberately best-effort: a repository connect/index-request
        // should succeed even if Kafka is unavailable (e.g. the "lite" Compose
        // profile doesn't run Kafka at all). kafkaTemplate.send() can fail in two
        // different ways that both need handling:
        //   1. Synchronously — e.g. the producer can't even be constructed because
        //      "bootstrap.servers" doesn't resolve (ConfigException). This throws
        //      immediately from send() itself, before any Future exists.
        //   2. Asynchronously — e.g. the broker is unreachable after the producer
        //      was created fine. This surfaces via the returned Future.
        // Only case 2 was handled before; case 1 propagated straight out of this
        // method and failed the whole request that triggered the event.
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