package com.devmind.analysisservice.service;

import com.devmind.analysisservice.domain.FindingSeverity;
import com.devmind.analysisservice.domain.PrReview;
import com.devmind.analysisservice.domain.PrReviewFinding;
import com.devmind.analysisservice.domain.ReviewStatus;
import com.devmind.analysisservice.dto.ReviewAnalyticsSummaryDto;
import com.devmind.analysisservice.dto.ReviewAnalyticsSummaryDto.SeverityCount;
import com.devmind.analysisservice.repository.PrReviewFindingRepository;
import com.devmind.analysisservice.repository.PrReviewRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewAnalyticsService {

    private final PrReviewRepository reviewRepository;
    private final PrReviewFindingRepository findingRepository;

    public ReviewAnalyticsService(PrReviewRepository reviewRepository, PrReviewFindingRepository findingRepository) {
        this.reviewRepository = reviewRepository;
        this.findingRepository = findingRepository;
    }

    public ReviewAnalyticsSummaryDto summary(String repositoryId) {
        List<PrReview> reviews = reviewRepository.findByRepositoryIdOrderByCreatedAtDesc(repositoryId);

        long completed = reviews.stream().filter(r -> r.getStatus() == ReviewStatus.COMPLETED).count();
        long failed = reviews.stream().filter(r -> r.getStatus() == ReviewStatus.FAILED).count();

        List<PrReview> finished = reviews.stream()
                .filter(r -> r.getCompletedAt() != null)
                .toList();

        Double avgTurnaroundSeconds = finished.isEmpty() ? null : finished.stream()
                .mapToLong(r -> Duration.between(r.getCreatedAt(), r.getCompletedAt()).getSeconds())
                .average()
                .orElse(0.0);

        List<String> reviewIds = reviews.stream().map(PrReview::getId).toList();
        List<PrReviewFinding> findings = reviewIds.isEmpty() ? List.of() : findingRepository.findByReviewIdIn(reviewIds);

        Map<FindingSeverity, Long> countsBySeverity = new EnumMap<>(FindingSeverity.class);
        for (FindingSeverity severity : FindingSeverity.values()) countsBySeverity.put(severity, 0L);
        for (PrReviewFinding f : findings) countsBySeverity.merge(f.getSeverity(), 1L, Long::sum);

        List<SeverityCount> findingsBySeverity = countsBySeverity.entrySet().stream()
                .map(e -> new SeverityCount(e.getKey().name(), e.getValue()))
                .toList();

        return new ReviewAnalyticsSummaryDto(reviews.size(), completed, failed, avgTurnaroundSeconds, findingsBySeverity);
    }
}
