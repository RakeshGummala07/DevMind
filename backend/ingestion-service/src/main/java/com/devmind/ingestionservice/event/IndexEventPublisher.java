package com.devmind.ingestionservice.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class IndexEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(IndexEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public IndexEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishStarted(IndexEvent source) {
        publish("repository.index.started", IndexEvent.of("repository.index.started", source));
    }

    public void publishCompleted(IndexEvent source) {
        publish("repository.index.completed", IndexEvent.of("repository.index.completed", source));
    }

    public void publishFailed(IndexEvent source) {
        publish("repository.index.failed", IndexEvent.of("repository.index.failed", source));
    }

    private void publish(String topic, IndexEvent event) {
        try {
            kafkaTemplate.send(topic, event.repositoryId(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Failed to publish {} for repository {}: {}", topic, event.repositoryId(), ex.getMessage());
                        } else {
                            log.info("Published {} for repository {}", topic, event.repositoryId());
                        }
                    });
        } catch (Exception e) {
            log.warn("Could not publish {} for repository {} — Kafka unavailable: {}", topic, event.repositoryId(), e.getMessage());
        }
    }
}
