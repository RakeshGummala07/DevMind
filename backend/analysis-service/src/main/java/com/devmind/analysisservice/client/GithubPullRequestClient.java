package com.devmind.analysisservice.client;

import com.devmind.analysisservice.exception.AppException;
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
public class GithubPullRequestClient {

    private static final Logger log = LoggerFactory.getLogger(GithubPullRequestClient.class);

    private final RestClient restClient = RestClient.builder().baseUrl("https://api.github.com").build();

    public record PullRequestSummary(
            int number, String title, String state,
            String headSha, String baseSha, int changedFiles
    ) {}

    public record ChangedFile(
            String filename, String status, int additions, int deletions, String patch
    ) {}

    public PullRequestSummary getPullRequest(String accessToken, String owner, String repo, int prNumber) {
        JsonNode pr;
        try {
            pr = restClient.get()
                    .uri("/repos/{owner}/{repo}/pulls/{number}", owner, repo, prNumber)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("Fetching PR #{} for {}/{} failed", prNumber, owner, repo, e);
            throw AppException.notFound("PULL_REQUEST_NOT_FOUND",
                    "Could not find PR #" + prNumber + " on " + owner + "/" + repo);
        }

        return new PullRequestSummary(
                pr.path("number").asInt(prNumber),
                pr.path("title").asText(""),
                pr.path("state").asText(""),
                pr.path("head").path("sha").asText(""),
                pr.path("base").path("sha").asText(""),
                pr.path("changed_files").asInt(0)
        );
    }

    public List<ChangedFile> listChangedFiles(String accessToken, String owner, String repo, int prNumber) {
        JsonNode[] files;
        try {
            files = restClient.get()
                    .uri("/repos/{owner}/{repo}/pulls/{number}/files?per_page=100", owner, repo, prNumber)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(JsonNode[].class);
        } catch (RestClientException e) {
            log.error("Fetching changed files for PR #{} on {}/{} failed", prNumber, owner, repo, e);
            throw AppException.serviceUnavailable("GITHUB_API_ERROR",
                    "Could not fetch changed files for PR #" + prNumber);
        }

        List<ChangedFile> result = new ArrayList<>();
        if (files == null) return result;

        if (files.length == 100) {
            log.warn("PR #{} on {}/{} returned exactly 100 changed files — likely truncated (pagination not implemented)",
                    prNumber, owner, repo);
        }

        for (JsonNode f : files) {
            String patch = f.has("patch") ? f.path("patch").asText(null) : null;
            result.add(new ChangedFile(
                    f.path("filename").asText(""),
                    f.path("status").asText(""),
                    f.path("additions").asInt(0),
                    f.path("deletions").asInt(0),
                    patch
            ));
        }
        return result;
    }
}
