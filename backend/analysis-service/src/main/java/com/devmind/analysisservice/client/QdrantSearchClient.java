package com.devmind.analysisservice.client;

import com.devmind.analysisservice.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class QdrantSearchClient {

    private static final Logger log = LoggerFactory.getLogger(QdrantSearchClient.class);

    private final RestClient restClient;
    private final String collectionName;

    public QdrantSearchClient(
            @Value("${devmind.qdrant-url}") String qdrantUrl,
            @Value("${devmind.qdrant-collection}") String collectionName
    ) {
        this.restClient = RestClient.builder().baseUrl(qdrantUrl).build();
        this.collectionName = collectionName;
    }

    public record ScoredChunk(
            double score, String filePath, String language, String githubFullName,
            String branch, int startLine, int endLine, String content
    ) {}

    public List<ScoredChunk> search(String repositoryId, List<Float> queryVector, int limit) {
        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/collections/{name}/points/search", collectionName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "vector", queryVector,
                            "limit", limit,
                            "with_payload", true,
                            "filter", Map.of("must", List.of(
                                    Map.of("key", "repositoryId", "match", Map.of("value", repositoryId))
                            ))
                    ))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Qdrant search failed: {}", e.getMessage());
            throw AppException.serviceUnavailable("QDRANT_UNAVAILABLE", "Could not search the code index");
        }

        List<ScoredChunk> results = new ArrayList<>();
        JsonNode hits = response.path("result");
        if (!hits.isArray()) return results;

        for (JsonNode hit : hits) {
            JsonNode payload = hit.path("payload");
            results.add(new ScoredChunk(
                    hit.path("score").asDouble(),
                    payload.path("filePath").asText(""),
                    payload.path("language").asText(""),
                    payload.path("githubFullName").asText(""),
                    payload.path("branch").asText(""),
                    payload.path("startLine").asInt(0),
                    payload.path("endLine").asInt(0),
                    payload.path("content").asText("")
            ));
        }
        return results;
    }
}
