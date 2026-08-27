package com.devmind.ingestionservice.client;

import com.devmind.ingestionservice.exception.AppException;
import com.devmind.ingestionservice.service.ChunkingService.CodeChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class QdrantClient {

    private static final Logger log = LoggerFactory.getLogger(QdrantClient.class);

    private final RestClient restClient;
    private final String collectionName;
    private final int embeddingDimensions;
    private volatile boolean collectionEnsured = false;

    public QdrantClient(
            @Value("${devmind.qdrant-url}") String qdrantUrl,
            @Value("${devmind.qdrant-collection}") String collectionName,
            @Value("${devmind.embedding-dimensions}") int embeddingDimensions
    ) {
        this.restClient = RestClient.builder().baseUrl(qdrantUrl).build();
        this.collectionName = collectionName;
        this.embeddingDimensions = embeddingDimensions;
    }

    public void ensureCollection() {
        if (collectionEnsured) return;

        try {
            restClient.get().uri("/collections/{name}", collectionName).retrieve().toBodilessEntity();
            collectionEnsured = true;
            return;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() != 404) {
                throw qdrantUnavailable(e);
            }
            // 404 — collection doesn't exist yet, fall through and create it.
        } catch (RestClientException e) {
            throw qdrantUnavailable(e);
        }

        try {
            restClient.put()
                    .uri("/collections/{name}", collectionName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("vectors", Map.of("size", embeddingDimensions, "distance", "Cosine")))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Created Qdrant collection '{}' (dim={})", collectionName, embeddingDimensions);
            collectionEnsured = true;
        } catch (RestClientException e) {
            throw qdrantUnavailable(e);
        }
    }

    public void upsertChunk(String repositoryId, String githubFullName, String branch, CodeChunk chunk, List<Float> vector) {
        ensureCollection();

        Map<String, Object> point = Map.of(
                "id", UUID.randomUUID().toString(),
                "vector", vector,
                "payload", Map.of(
                        "repositoryId", repositoryId,
                        "githubFullName", githubFullName,
                        "filePath", chunk.filePath(),
                        "language", chunk.language(),
                        "branch", branch,
                        "chunkIndex", chunk.chunkIndex(),
                        "startLine", chunk.startLine(),
                        "endLine", chunk.endLine(),
                        "content", chunk.content()
                )
        );

        try {
            restClient.put()
                    .uri("/collections/{name}/points?wait=true", collectionName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("points", List.of(point)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw qdrantUnavailable(e);
        }
    }

    /** Deletes every point for a repository — used before re-indexing so stale chunks from a previous run don't linger. */
    public void deleteRepositoryChunks(String repositoryId) {
        ensureCollection();
        try {
            restClient.post()
                    .uri("/collections/{name}/points/delete?wait=true", collectionName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("filter", Map.of("must", List.of(
                            Map.of("key", "repositoryId", "match", Map.of("value", repositoryId))
                    ))))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not clear existing chunks for repository {} before re-indexing: {}", repositoryId, e.getMessage());
        }
    }

    private AppException qdrantUnavailable(Exception e) {
        log.error("Qdrant request failed: {}", e.getMessage());
        return new AppException("QDRANT_UNAVAILABLE", "Could not reach Qdrant", HttpStatus.SERVICE_UNAVAILABLE);
    }
}
