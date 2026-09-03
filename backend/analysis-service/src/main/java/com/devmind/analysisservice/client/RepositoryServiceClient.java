package com.devmind.analysisservice.client;

import com.devmind.analysisservice.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;

@Component
public class RepositoryServiceClient {

    private static final Logger log = LoggerFactory.getLogger(RepositoryServiceClient.class);

    private final RestClient restClient;

    public RepositoryServiceClient(@Value("${devmind.repository-service-url}") String repositoryServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(repositoryServiceUrl).build();
    }

    public record RepositoryInfo(
            String id, String fullName, String name, String owner,
            String defaultBranch, boolean isPrivate
    ) {}

    private record RemoteApiResponse<T>(boolean success, T data, String message, Instant timestamp) {}

    public RepositoryInfo getRepository(String repositoryId) {
        try {
            RemoteApiResponse<RepositoryInfo> response = restClient.get()
                    .uri("/api/repositories/{id}", repositoryId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<RemoteApiResponse<RepositoryInfo>>() {});

            if (response == null || response.data() == null) {
                throw AppException.notFound("REPOSITORY_NOT_FOUND", "Repository " + repositoryId + " was not found");
            }
            return response.data();

        } catch (RestClientResponseException e) {
            HttpStatusCode status = e.getStatusCode();
            if (status.value() == 404) {
                throw AppException.notFound("REPOSITORY_NOT_FOUND", "Repository " + repositoryId + " was not found");
            }
            log.error("Unexpected response from repository-service: {}", status, e);
            throw AppException.serviceUnavailable("REPOSITORY_SERVICE_ERROR", "Could not fetch repository details");
        } catch (RestClientException e) {
            log.error("Could not reach repository-service at all", e);
            throw AppException.serviceUnavailable("REPOSITORY_SERVICE_UNREACHABLE",
                    "Could not reach repository-service. Please try again.");
        }
    }
}
