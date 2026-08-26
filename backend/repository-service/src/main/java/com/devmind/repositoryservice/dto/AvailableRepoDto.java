package com.devmind.repositoryservice.dto;

import com.devmind.repositoryservice.client.GithubApiClient.GithubRepoSummary;

/** A GitHub repo the user has access to but hasn't connected to DevMind yet. */
public record AvailableRepoDto(
        Long githubRepoId, String fullName, String name, String owner, String description,
        String htmlUrl, String primaryLanguage, boolean isPrivate, int starsCount, int forksCount,
        boolean alreadyConnected
) {
    public static AvailableRepoDto from(GithubRepoSummary summary, boolean alreadyConnected) {
        return new AvailableRepoDto(
                summary.id(), summary.fullName(), summary.name(), summary.owner(), summary.description(),
                summary.htmlUrl(), summary.primaryLanguage(), summary.isPrivate(),
                summary.starsCount(), summary.forksCount(), alreadyConnected
        );
    }
}
