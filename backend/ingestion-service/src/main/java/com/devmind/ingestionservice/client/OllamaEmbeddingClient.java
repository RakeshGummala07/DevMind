package com.devmind.ingestionservice.client;

import com.devmind.ingestionservice.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class OllamaEmbeddingClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaEmbeddingClient.class);

    private final RestClient restClient;
    private final String embeddingModel;

    public OllamaEmbeddingClient(
            @Value("${devmind.ollama-base-url}") String ollamaBaseUrl,
            @Value("${devmind.embedding-model}") String embeddingModel
    ) {
        this.restClient = RestClient.builder().baseUrl(ollamaBaseUrl).build();
        this.embeddingModel = embeddingModel;
    }

    public List<Float> embed(String text) {

        String prefixedText = "search_document: " + text;

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/api/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("model", embeddingModel, "prompt", prefixedText))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Ollama embedding request failed: {}", e.getMessage());
            throw new AppException("OLLAMA_UNAVAILABLE",
                    "Could not reach Ollama to generate embeddings — is it running and has the model been pulled?",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        JsonNode embeddingNode = response.path("embedding");
        if (!embeddingNode.isArray() || embeddingNode.isEmpty()) {
            throw new AppException("OLLAMA_EMPTY_EMBEDDING",
                    "Ollama returned no embedding — confirm '" + embeddingModel + "' is pulled (ollama pull " + embeddingModel + ")",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        List<Float> vector = new ArrayList<>(embeddingNode.size());
        embeddingNode.forEach(n -> vector.add((float) n.asDouble()));
        return vector;
    }
}