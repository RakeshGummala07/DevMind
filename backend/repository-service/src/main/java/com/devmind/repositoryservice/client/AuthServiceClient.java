package com.devmind.repositoryservice.client;

import com.devmind.repositoryservice.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

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
        } catch (RestClientResponseException e) {
            HttpStatusCode status = e.getStatusCode();
            if (status.value() == 401) {

                log.error("auth-service rejected the internal API key — INTERNAL_API_KEY likely " +
                        "doesn't match between repository-service and auth-service");
                throw AppException.unauthorized("INTERNAL_AUTH_FAILED",
                        "Internal service authentication failed (check INTERNAL_API_KEY on both services)");
            }
            if (status.value() == 400) {
                // This is the expected/legitimate case: auth-service knows the user but they
                // haven't linked GitHub yet.
                throw AppException.badRequest("GITHUB_NOT_CONNECTED", "Connect a GitHub account before browsing repositories");
            }
            log.error("Unexpected response from auth-service internal endpoint: {}", status, e);
            throw AppException.badRequest("GITHUB_NOT_CONNECTED", "Connect a GitHub account before browsing repositories");
        } catch (RestClientException e) {
            // auth-service unreachable entirely (down, DNS, network) — also not a "go click
            // Connect" situation.
            log.error("Could not reach auth-service at all", e);
            throw AppException.unauthorized("AUTH_SERVICE_UNREACHABLE", "Could not reach the authentication service. Please try again.");
        }
    }
}