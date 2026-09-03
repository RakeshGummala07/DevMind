package com.devmind.ingestionservice.service;

import com.devmind.ingestionservice.client.AuthServiceClient;
import com.devmind.ingestionservice.client.OllamaEmbeddingClient;
import com.devmind.ingestionservice.client.QdrantClient;
import com.devmind.ingestionservice.event.IndexEvent;
import com.devmind.ingestionservice.event.IndexEventPublisher;
import com.devmind.ingestionservice.service.ChunkingService.CodeChunk;
import com.devmind.ingestionservice.service.FileDiscoveryService.DiscoveredFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.List;

@Service
public class IngestionPipelineService {

    private static final Logger log = LoggerFactory.getLogger(IngestionPipelineService.class);

    private final AuthServiceClient authServiceClient;
    private final GitCloneService gitCloneService;
    private final FileDiscoveryService fileDiscoveryService;
    private final ChunkingService chunkingService;
    private final OllamaEmbeddingClient embeddingClient;
    private final QdrantClient qdrantClient;
    private final IndexEventPublisher eventPublisher;

    public IngestionPipelineService(
            AuthServiceClient authServiceClient,
            GitCloneService gitCloneService,
            FileDiscoveryService fileDiscoveryService,
            ChunkingService chunkingService,
            OllamaEmbeddingClient embeddingClient,
            QdrantClient qdrantClient,
            IndexEventPublisher eventPublisher
    ) {
        this.authServiceClient = authServiceClient;
        this.gitCloneService = gitCloneService;
        this.fileDiscoveryService = fileDiscoveryService;
        this.chunkingService = chunkingService;
        this.embeddingClient = embeddingClient;
        this.qdrantClient = qdrantClient;
        this.eventPublisher = eventPublisher;
    }

    public void run(IndexEvent request) {
        eventPublisher.publishStarted(request);
        log.info("Indexing started for {} ({})", request.githubFullName(), request.repositoryId());

        Path checkout = null;
        try {
            String token = authServiceClient.getGithubToken(request.connectedByUserId()).githubAccessToken();
            checkout = gitCloneService.clone(request.githubFullName(), request.defaultBranch(), token);

            List<DiscoveredFile> files = fileDiscoveryService.discover(checkout);
            log.info("Discovered {} indexable files in {}", files.size(), request.githubFullName());
            qdrantClient.deleteRepositoryChunks(request.repositoryId());

            int chunkCount = 0;
            int embeddingFailures = 0;

            for (DiscoveredFile file : files) {
                List<CodeChunk> chunks = chunkingService.chunk(file);
                for (CodeChunk chunk : chunks) {
                    try {
                        List<Float> vector = embeddingClient.embed(chunk.content());
                        qdrantClient.upsertChunk(request.repositoryId(), request.githubFullName(), request.defaultBranch(), chunk, vector);
                        chunkCount++;
                    } catch (Exception e) {
                        embeddingFailures++;
                        log.warn("Skipped chunk {}#{} for {}: {}", file.relativePath(), chunk.chunkIndex(), request.githubFullName(), e.getMessage());
                    }
                }
            }

            log.info("Indexing completed for {}: {} chunks embedded, {} skipped",
                    request.githubFullName(), chunkCount, embeddingFailures);
            eventPublisher.publishCompleted(request);

        } catch (Exception e) {
            log.error("Indexing failed for {}: {}", request.githubFullName(), e.getMessage(), e);
            eventPublisher.publishFailed(request);
        } finally {
            if (checkout != null) {
                gitCloneService.cleanup(checkout);
            }
        }
    }
}
