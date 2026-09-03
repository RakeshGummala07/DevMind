package com.devmind.repositoryservice.dto;

import com.devmind.repositoryservice.client.GithubApiClient.GithubPullRequestSummary;

public record PullRequestDto(
        int number, String title, String state, String authorLogin,
        String headSha, String baseSha, String htmlUrl, String updatedAt
) {
    public static PullRequestDto from(GithubPullRequestSummary summary) {
        return new PullRequestDto(
                summary.number(), summary.title(), summary.state(), summary.authorLogin(),
                summary.headSha(), summary.baseSha(), summary.htmlUrl(), summary.updatedAt()
        );
    }
}
