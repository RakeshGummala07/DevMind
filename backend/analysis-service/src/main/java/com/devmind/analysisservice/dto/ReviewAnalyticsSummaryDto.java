package com.devmind.analysisservice.dto;

import java.util.List;

public record ReviewAnalyticsSummaryDto(
        long totalReviews, long completedReviews, long failedReviews,
        Double avgTurnaroundSeconds, // null when nothing has completed yet
        List<SeverityCount> findingsBySeverity
) {
    public record SeverityCount(String severity, long count) {}
}
