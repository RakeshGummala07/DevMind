package com.devmind.authservice.security;

import com.devmind.authservice.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
public class GithubOAuthClient {

    private static final Logger log = LoggerFactory.getLogger(GithubOAuthClient.class);

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String clientId;
    private final String clientSecret;

    public GithubOAuthClient(
            @Value("${devmind.github-client-id}") String clientId,
            @Value("${devmind.github-client-secret}") String clientSecret
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public record GithubProfile(Long id, String login, String name, String email, String avatarUrl, String accessToken) {}

    public GithubProfile exchangeCodeForProfile(String code) {
        if (clientId == null || clientId.isBlank() || clientId.equals("replace_me")) {
            throw AppException.badRequest("GITHUB_OAUTH_NOT_CONFIGURED",
                    "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not configured on the server");
        }
        String githubAccessToken = exchangeCodeForToken(code);
        return fetchProfile(githubAccessToken);
    }

    private String exchangeCodeForToken(String code) {
        String body;
        try {
            body = restClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "client_id", clientId,
                            "client_secret", clientSecret,
                            "code", code
                    ))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            log.error("GitHub token exchange request failed", e);
            throw AppException.unauthorized("GITHUB_OAUTH_FAILED", "Could not reach GitHub to complete sign-in. Please try again.");
        }

        try {
            JsonNode json = objectMapper.readTree(body);
            if (json.has("error")) {
                log.warn("GitHub token exchange returned an error: {}", json.toString());
                throw AppException.unauthorized("GITHUB_OAUTH_FAILED",
                        json.path("error_description").asText("GitHub rejected the sign-in request"));
            }
            String accessToken = json.path("access_token").asText(null);
            if (accessToken == null || accessToken.isBlank()) {
                throw AppException.unauthorized("GITHUB_OAUTH_FAILED", "GitHub did not return an access token");
            }
            return accessToken;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Could not parse GitHub token response: {}", body, e);
            throw AppException.unauthorized("GITHUB_OAUTH_FAILED", "Could not parse GitHub's response");
        }
    }

    private GithubProfile fetchProfile(String githubAccessToken) {
        JsonNode profile;
        try {
            profile = restClient.get()
                    .uri("https://api.github.com/user")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + githubAccessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Fetching GitHub profile failed", e);
            throw AppException.unauthorized("GITHUB_PROFILE_FETCH_FAILED", "Could not fetch your GitHub profile");
        }

        String email = profile.path("email").isNull() ? null : profile.path("email").asText(null);
        if (email == null) {
            email = fetchPrimaryEmail(githubAccessToken);
        }

        return new GithubProfile(
                profile.path("id").asLong(),
                profile.path("login").asText(),
                profile.path("name").isNull() ? profile.path("login").asText() : profile.path("name").asText(),
                email,
                profile.path("avatar_url").asText(null),
                githubAccessToken
        );
    }

    @SuppressWarnings("unchecked")
    private String fetchPrimaryEmail(String githubAccessToken) {
        List<Map<String, Object>> emails;
        try {
            emails = restClient.get()
                    .uri("https://api.github.com/user/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + githubAccessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(List.class);
        } catch (RestClientException e) {
            log.warn("Fetching GitHub emails failed, continuing without one: {}", e.getMessage());
            return null;
        }

        if (emails == null) return null;
        return emails.stream()
                .filter(e -> Boolean.TRUE.equals(e.get("primary")))
                .map(e -> (String) e.get("email"))
                .findFirst()
                .orElse(null);
    }
}