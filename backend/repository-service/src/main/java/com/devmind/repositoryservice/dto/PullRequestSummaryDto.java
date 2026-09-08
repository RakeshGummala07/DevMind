package com.devmind.repositoryservice.dto;

import com.devmind.repositoryservice.domain.RepoPullRequest;

import java.time.Instant;
import java.util.List;

public record PullRequestSummaryDto(
        long openCount, long mergedCount, long closedCount,
        Double avgTimeToMergeHours, // null when nothing has been merged yet — not zero, which would be misleading
        List<PullRequestItemDto> recent
) {
    public record PullRequestItemDto(
            int number, String title, String state, String authorLogin,
            Instant openedAt, Instant closedAt, Instant mergedAt
    ) {
        public static PullRequestItemDto from(RepoPullRequest pr) {
            return new PullRequestItemDto(
                    pr.getPrNumber(), pr.getTitle(), pr.getState().name(), pr.getAuthorLogin(),
                    pr.getOpenedAt(), pr.getClosedAt(), pr.getMergedAt()
            );
        }
    }
}
