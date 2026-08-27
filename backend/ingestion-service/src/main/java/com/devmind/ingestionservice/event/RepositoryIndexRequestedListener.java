package com.devmind.ingestionservice.event;

import com.devmind.ingestionservice.service.IngestionPipelineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class RepositoryIndexRequestedListener {

    private static final Logger log = LoggerFactory.getLogger(RepositoryIndexRequestedListener.class);

    private final IngestionPipelineService pipelineService;

    public RepositoryIndexRequestedListener(IngestionPipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @KafkaListener(topics = "repository.index.requested", groupId = "ingestion-service")
    @Async
    public void onIndexRequested(IndexEvent event) {
        log.info("Received index request for {} ({})", event.githubFullName(), event.repositoryId());
        pipelineService.run(event);
    }
}
