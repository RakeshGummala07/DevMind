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
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    private final RestClient restClient;
    private final String embeddingModel;
    private final String chatModel;
    private final int maxAnswerTokens;

    public OllamaClient(
            @Value("${devmind.ollama-base-url}") String ollamaBaseUrl,
            @Value("${devmind.embedding-model}") String embeddingModel,
            @Value("${devmind.ai-model}") String chatModel,
            @Value("${devmind.max-answer-tokens}") int maxAnswerTokens
    ) {
        this.restClient = RestClient.builder().baseUrl(ollamaBaseUrl).build();
        this.embeddingModel = embeddingModel;
        this.chatModel = chatModel;
        this.maxAnswerTokens = maxAnswerTokens;
    }

    public List<Float> embed(String text) {

        String prefixedText = "search_query: " + text;

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
            throw AppException.serviceUnavailable("OLLAMA_UNAVAILABLE",
                    "Could not reach Ollama to generate an embedding — is it running and has '" + embeddingModel + "' been pulled?");
        }

        JsonNode embeddingNode = response.path("embedding");
        if (!embeddingNode.isArray() || embeddingNode.isEmpty()) {
            throw AppException.serviceUnavailable("OLLAMA_EMPTY_EMBEDDING",
                    "Ollama returned no embedding for the query");
        }

        List<Float> vector = new ArrayList<>(embeddingNode.size());
        embeddingNode.forEach(n -> vector.add((float) n.asDouble()));
        return vector;
    }

    public String generate(String prompt) {
        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "model", chatModel,
                            "prompt", prompt,
                            "stream", false,
                            "options", Map.of("num_predict", maxAnswerTokens)
                    ))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Ollama generate request failed: {}", e.getMessage());
            throw AppException.serviceUnavailable("OLLAMA_UNAVAILABLE",
                    "Could not reach Ollama to generate an answer — is it running and has '" + chatModel + "' been pulled?");
        }

        String answer = response.path("response").asText(null);
        if (answer == null || answer.isBlank()) {
            throw AppException.serviceUnavailable("OLLAMA_EMPTY_RESPONSE", "Ollama returned an empty answer");
        }
        return answer.trim();
    }
}
