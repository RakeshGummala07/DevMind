package com.devmind.repositoryservice.dto;

import java.util.List;

public record CommitActivityDto(
        int totalCommits,
        List<DailyCount> byDay,
        List<ContributorCount> topContributors
) {
    public record DailyCount(String date, long count) {}
    public record ContributorCount(String login, long count) {}
}
