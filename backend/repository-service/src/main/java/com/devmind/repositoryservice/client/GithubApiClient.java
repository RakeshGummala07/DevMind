package com.devmind.repositoryservice.client;

import com.devmind.repositoryservice.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

@Component
public class GithubApiClient {

    private static final Logger log = LoggerFactory.getLogger(GithubApiClient.class);

    private final RestClient restClient = RestClient.builder().baseUrl("https://api.github.com").build();

    public record GithubRepoSummary(
            Long id, String fullName, String name, String owner, String description,
            String htmlUrl, String defaultBranch, String primaryLanguage,
            boolean isPrivate, int starsCount, int forksCount
    ) {}

    public List<GithubRepoSummary> listUserRepos(String accessToken) {
        JsonNode[] repos;
        try {
            repos = restClient.get()
                    .uri("/user/repos?sort=pushed&per_page=50")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode[].class);
        } catch (RestClientException e) {
            log.error("Listing GitHub repos failed", e);
            throw AppException.unauthorized("GITHUB_API_ERROR",
                    "Could not list your GitHub repositories. Your GitHub connection may have expired — try reconnecting.");
        }

        List<GithubRepoSummary> result = new ArrayList<>();
        if (repos == null) return result;

        for (JsonNode repo : repos) {
            result.add(toSummary(repo));
        }
        return result;
    }

    public GithubRepoSummary getRepo(String accessToken, String fullName) {
        String[] parts = fullName.split("/", 2);
        if (parts.length != 2) {
            throw AppException.badRequest("INVALID_REPO_NAME", "Expected \"owner/repo\", got \"" + fullName + "\"");
        }
        String owner = parts[0];
        String repoName = parts[1];

        JsonNode repo;
        try {
            repo = restClient.get()
                    .uri("/repos/{owner}/{repo}", owner, repoName)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Fetching GitHub repo {} failed", fullName, e);
            throw AppException.notFound("GITHUB_REPO_NOT_FOUND",
                    "Could not find or access " + fullName + " on GitHub");
        }
        return toSummary(repo);
    }

    public record GithubPullRequestSummary(
            int number, String title, String state, String authorLogin,
            String headSha, String baseSha, String htmlUrl, String updatedAt
    ) {}

    public List<GithubPullRequestSummary> listPullRequests(String accessToken, String owner, String repo) {
        JsonNode[] prs;
        try {
            prs = restClient.get()
                    .uri("/repos/{owner}/{repo}/pulls?state=open&sort=updated&direction=desc&per_page=50", owner, repo)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode[].class);
        } catch (RestClientException e) {
            log.error("Listing pull requests for {}/{} failed", owner, repo, e);
            throw AppException.unauthorized("GITHUB_API_ERROR",
                    "Could not list pull requests for " + owner + "/" + repo + ". Your GitHub connection may have expired — try reconnecting.");
        }

        List<GithubPullRequestSummary> result = new ArrayList<>();
        if (prs == null) return result;

        for (JsonNode pr : prs) {
            result.add(new GithubPullRequestSummary(
                    pr.path("number").asInt(),
                    pr.path("title").asText(""),
                    pr.path("state").asText(""),
                    pr.path("user").path("login").asText(""),
                    pr.path("head").path("sha").asText(""),
                    pr.path("base").path("sha").asText(""),
                    pr.path("html_url").asText(""),
                    pr.path("updated_at").asText("")
            ));
        }
        return result;
    }

    private GithubRepoSummary toSummary(JsonNode repo) {
        return new GithubRepoSummary(
                repo.path("id").asLong(),
                repo.path("full_name").asText(),
                repo.path("name").asText(),
                repo.path("owner").path("login").asText(),
                repo.path("description").isNull() ? null : repo.path("description").asText(),
                repo.path("html_url").asText(),
                repo.path("default_branch").asText("main"),
                repo.path("language").isNull() ? null : repo.path("language").asText(),
                repo.path("private").asBoolean(false),
                repo.path("stargazers_count").asInt(0),
                repo.path("forks_count").asInt(0)
        );
    }
}