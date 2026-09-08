package com.devmind.repositoryservice.service;

import com.devmind.repositoryservice.domain.PullRequestState;
import com.devmind.repositoryservice.domain.RepoCommit;
import com.devmind.repositoryservice.domain.RepoPullRequest;
import com.devmind.repositoryservice.dto.CommitActivityDto;
import com.devmind.repositoryservice.dto.CommitActivityDto.ContributorCount;
import com.devmind.repositoryservice.dto.CommitActivityDto.DailyCount;
import com.devmind.repositoryservice.dto.PullRequestSummaryDto;
import com.devmind.repositoryservice.dto.PullRequestSummaryDto.PullRequestItemDto;
import com.devmind.repositoryservice.repository.RepoCommitRepository;
import com.devmind.repositoryservice.repository.RepoPullRequestRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RepositoryAnalyticsService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);
    private static final int TOP_CONTRIBUTORS_LIMIT = 5;
    private static final int RECENT_PRS_LIMIT = 10;

    private final RepoCommitRepository commitRepository;
    private final RepoPullRequestRepository pullRequestRepository;

    public RepositoryAnalyticsService(RepoCommitRepository commitRepository, RepoPullRequestRepository pullRequestRepository) {
        this.commitRepository = commitRepository;
        this.pullRequestRepository = pullRequestRepository;
    }

    public CommitActivityDto commitActivity(String repositoryId, int days) {
        Instant since = Instant.now().minus(Duration.ofDays(days));
        List<RepoCommit> commits = commitRepository.findByRepositoryIdAndCommittedAtAfterOrderByCommittedAtAsc(repositoryId, since);

        // Zero-filled day buckets so the chart doesn't silently skip quiet days.
        Map<String, Long> byDay = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            byDay.put(DAY_FORMAT.format(Instant.now().minus(Duration.ofDays(i))), 0L);
        }
        for (RepoCommit c : commits) {
            String day = DAY_FORMAT.format(c.getCommittedAt());
            byDay.merge(day, 1L, Long::sum);
        }

        Map<String, Long> byContributor = new LinkedHashMap<>();
        for (RepoCommit c : commits) {
            String login = c.getAuthorLogin() != null ? c.getAuthorLogin() : (c.getAuthorName() != null ? c.getAuthorName() : "unknown");
            byContributor.merge(login, 1L, Long::sum);
        }

        List<ContributorCount> topContributors = byContributor.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(TOP_CONTRIBUTORS_LIMIT)
                .map(e -> new ContributorCount(e.getKey(), e.getValue()))
                .toList();

        List<DailyCount> dailyCounts = byDay.entrySet().stream()
                .map(e -> new DailyCount(e.getKey(), e.getValue()))
                .toList();

        long total = commitRepository.countByRepositoryId(repositoryId);

        return new CommitActivityDto((int) total, dailyCounts, topContributors);
    }

    public PullRequestSummaryDto pullRequestSummary(String repositoryId) {
        List<RepoPullRequest> all = pullRequestRepository.findByRepositoryIdOrderByOpenedAtDesc(repositoryId);

        long open = all.stream().filter(pr -> pr.getState() == PullRequestState.OPEN).count();
        long merged = all.stream().filter(pr -> pr.getState() == PullRequestState.MERGED).count();
        long closed = all.stream().filter(pr -> pr.getState() == PullRequestState.CLOSED).count();

        List<RepoPullRequest> mergedPrs = all.stream()
                .filter(pr -> pr.getState() == PullRequestState.MERGED && pr.getMergedAt() != null)
                .toList();

        Double avgTimeToMergeHours = mergedPrs.isEmpty() ? null : mergedPrs.stream()
                .mapToDouble(pr -> Duration.between(pr.getOpenedAt(), pr.getMergedAt()).toMinutes() / 60.0)
                .average()
                .orElse(0.0);

        List<PullRequestItemDto> recent = all.stream()
                .sorted(Comparator.comparing(RepoPullRequest::getOpenedAt).reversed())
                .limit(RECENT_PRS_LIMIT)
                .map(PullRequestItemDto::from)
                .toList();

        return new PullRequestSummaryDto(open, merged, closed, avgTimeToMergeHours, recent);
    }
}
