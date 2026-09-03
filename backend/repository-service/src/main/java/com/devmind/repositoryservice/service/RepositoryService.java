package com.devmind.repositoryservice.service;

import com.devmind.repositoryservice.client.AuthServiceClient;
import com.devmind.repositoryservice.client.GithubApiClient;
import com.devmind.repositoryservice.client.GithubApiClient.GithubRepoSummary;
import com.devmind.repositoryservice.domain.IndexingStatus;
import com.devmind.repositoryservice.domain.Repository;
import com.devmind.repositoryservice.dto.AvailableRepoDto;
import com.devmind.repositoryservice.dto.PullRequestDto;
import com.devmind.repositoryservice.dto.RepositoryDto;
import com.devmind.repositoryservice.event.RepositoryEventPublisher;
import com.devmind.repositoryservice.exception.AppException;
import com.devmind.repositoryservice.repository.RepositoryJpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RepositoryService {

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final AuthServiceClient authServiceClient;
    private final GithubApiClient githubApiClient;
    private final RepositoryEventPublisher eventPublisher;

    public RepositoryService(
            RepositoryJpaRepository repositoryJpaRepository,
            AuthServiceClient authServiceClient,
            GithubApiClient githubApiClient,
            RepositoryEventPublisher eventPublisher
    ) {
        this.repositoryJpaRepository = repositoryJpaRepository;
        this.authServiceClient = authServiceClient;
        this.githubApiClient = githubApiClient;
        this.eventPublisher = eventPublisher;
    }

    public List<RepositoryDto> listConnected(String userId) {
        return repositoryJpaRepository.findByConnectedByUserId(userId).stream()
                .map(RepositoryDto::from)
                .toList();
    }


    public List<AvailableRepoDto> listAvailable(String userId) {
        String token = authServiceClient.getGithubToken(userId).githubAccessToken();
        List<GithubRepoSummary> repos = githubApiClient.listUserRepos(token);

        Set<Long> connectedGithubIds = repositoryJpaRepository.findByConnectedByUserId(userId).stream()
                .map(Repository::getGithubRepoId)
                .collect(Collectors.toSet());

        return repos.stream()
                .map(repo -> AvailableRepoDto.from(repo, connectedGithubIds.contains(repo.id())))
                .toList();
    }

    @Transactional
    public RepositoryDto connect(String userId, String fullName) {
        String token = authServiceClient.getGithubToken(userId).githubAccessToken();
        GithubRepoSummary summary = githubApiClient.getRepo(token, fullName);

        if (repositoryJpaRepository.existsByGithubRepoId(summary.id())) {
            throw AppException.conflict("REPOSITORY_ALREADY_CONNECTED", "This repository is already connected");
        }

        Repository repo = Repository.connect(
                summary.id(), summary.fullName(), summary.name(), summary.owner(), summary.description(),
                summary.htmlUrl(), summary.defaultBranch() != null ? summary.defaultBranch() : "main",
                summary.primaryLanguage(), summary.isPrivate(), summary.starsCount(), summary.forksCount(), userId
        );
        repositoryJpaRepository.save(repo);
        eventPublisher.publishRepositoryCreated(repo);

        return RepositoryDto.from(repo);
    }

    public RepositoryDto getById(String repositoryId) {
        return repositoryJpaRepository.findById(repositoryId)
                .map(RepositoryDto::from)
                .orElseThrow(() -> AppException.notFound("REPOSITORY_NOT_FOUND", "Repository was not found"));
    }

    public List<PullRequestDto> listPullRequests(String repositoryId) {
        Repository repo = repositoryJpaRepository.findById(repositoryId)
                .orElseThrow(() -> AppException.notFound("REPOSITORY_NOT_FOUND", "Repository was not found"));

        // Uses the repo's own connectedByUserId, not any requesting user — the
        // person browsing PRs may not be the one who originally connected the
        // repo, but we always need the token belonging to whoever's GitHub
        // connection this repo is actually indexed/authorized under.
        String token = authServiceClient.getGithubToken(repo.getConnectedByUserId()).githubAccessToken();
        return githubApiClient.listPullRequests(token, repo.getOwner(), repo.getName()).stream()
                .map(PullRequestDto::from)
                .toList();
    }

    @Transactional
    public RepositoryDto requestIndexing(String repositoryId) {
        Repository repo = repositoryJpaRepository.findById(repositoryId)
                .orElseThrow(() -> AppException.notFound("REPOSITORY_NOT_FOUND", "Repository was not found"));

        repo.setIndexingStatus(IndexingStatus.INDEXING);
        repositoryJpaRepository.save(repo);

        eventPublisher.publishIndexRequested(repo);
        return RepositoryDto.from(repo);
    }
}
