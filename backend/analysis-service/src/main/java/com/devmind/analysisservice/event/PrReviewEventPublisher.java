package com.devmind.analysisservice.event;

import com.devmind.analysisservice.domain.PrReview;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PrReviewEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PrReviewEventPublisher.class);

    public static final String TOPIC_REVIEW_COMPLETED = "pr.review.completed";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PrReviewEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishCompleted(PrReview review) {
        PrReviewCompletedEvent event = PrReviewCompletedEvent.of(
                review.getId(), review.getRepositoryId(), review.getPrNumber(),
                review.getStatus().name(), review.getFindingsCount(), review.getRequestedByUserId()
        );

        try {
            kafkaTemplate.send(TOPIC_REVIEW_COMPLETED, review.getRepositoryId(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Failed to publish {} for review {}: {}", TOPIC_REVIEW_COMPLETED, review.getId(), ex.getMessage());
                        } else {
                            log.info("Published {} for review {}", TOPIC_REVIEW_COMPLETED, review.getId());
                        }
                    });
        } catch (Exception e) {
            // Same principle as everywhere else this pattern appears: a
            // notification that never arrives is a minor inconvenience,
            // not a reason to fail the review the user is waiting on.
            log.warn("Could not publish {} for review {} — Kafka unavailable: {}", TOPIC_REVIEW_COMPLETED, review.getId(), e.getMessage());
        }
    }
}
