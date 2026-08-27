package com.devmind.repositoryservice.event;

import com.devmind.repositoryservice.domain.IndexingStatus;
import com.devmind.repositoryservice.repository.RepositoryJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class IndexStatusConsumer {

    private static final Logger log = LoggerFactory.getLogger(IndexStatusConsumer.class);

    private final RepositoryJpaRepository repositoryJpaRepository;

    public IndexStatusConsumer(RepositoryJpaRepository repositoryJpaRepository) {
        this.repositoryJpaRepository = repositoryJpaRepository;
    }

    @KafkaListener(topics = "repository.index.started", groupId = "repository-service")
    @Transactional
    public void onIndexStarted(RepositoryEvent event) {
        updateStatus(event, IndexingStatus.INDEXING);
    }

    @KafkaListener(topics = "repository.index.completed", groupId = "repository-service")
    @Transactional
    public void onIndexCompleted(RepositoryEvent event) {
        updateStatus(event, IndexingStatus.COMPLETED);
    }

    @KafkaListener(topics = "repository.index.failed", groupId = "repository-service")
    @Transactional
    public void onIndexFailed(RepositoryEvent event) {
        updateStatus(event, IndexingStatus.FAILED);
    }

    private void updateStatus(RepositoryEvent event, IndexingStatus status) {
        repositoryJpaRepository.findById(event.repositoryId()).ifPresentOrElse(
                repo -> {
                    repo.setIndexingStatus(status);
                    repositoryJpaRepository.save(repo);
                    log.info("Repository {} indexing status -> {}", event.repositoryId(), status);
                },
                () -> log.warn("Received {} for unknown repository {}", event.eventType(), event.repositoryId())
        );
    }
}
