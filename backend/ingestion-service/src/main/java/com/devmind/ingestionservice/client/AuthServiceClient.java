package com.devmind.ingestionservice.client;

import com.devmind.ingestionservice.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AuthServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);

    private final RestClient restClient;
    private final String internalApiKey;

    public AuthServiceClient(
            @Value("${devmind.auth-service-url}") String authServiceUrl,
            @Value("${devmind.internal-api-key}") String internalApiKey
    ) {
        this.restClient = RestClient.builder().baseUrl(authServiceUrl).build();
        this.internalApiKey = internalApiKey;
    }

    public record GithubTokenResponse(String githubAccessToken, String githubUsername) {}

    public GithubTokenResponse getGithubToken(String userId) {
        try {
            return restClient.get()
                    .uri("/internal/users/{userId}/github-token", userId)
                    .header("X-Internal-Api-Key", internalApiKey)
                    .retrieve()
                    .body(GithubTokenResponse.class);
        } catch (RestClientException e) {
            log.error("Could not fetch GitHub token for user {}: {}", userId, e.getMessage());
            throw AppException.unauthorized("GITHUB_TOKEN_UNAVAILABLE", "Could not obtain a GitHub token for this repository's owner");
        }
    }
}
