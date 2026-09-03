package com.devmind.analysisservice.dto;

import com.devmind.analysisservice.domain.PrReview;
import com.devmind.analysisservice.domain.PrReviewFinding;

import java.time.Instant;
import java.util.List;

public record PrReviewDto(
        String id, String repositoryId, int prNumber, String prTitle,
        String headSha, String baseSha, String status,
        int filesReviewed, int findingsCount, String summary, String errorMessage,
        Instant createdAt, Instant completedAt, List<FindingDto> findings
) {
    public record FindingDto(String filePath, String severity, String message, Integer lineNumber, boolean grounded) {
        public static FindingDto from(PrReviewFinding f) {
            return new FindingDto(f.getFilePath(), f.getSeverity().name(), f.getMessage(), f.getLineNumber(), f.isGrounded());
        }
    }

    public static PrReviewDto from(PrReview r, List<PrReviewFinding> findings) {
        return new PrReviewDto(
                r.getId(), r.getRepositoryId(), r.getPrNumber(), r.getPrTitle(),
                r.getHeadSha(), r.getBaseSha(), r.getStatus().name(),
                r.getFilesReviewed(), r.getFindingsCount(), r.getSummary(), r.getErrorMessage(),
                r.getCreatedAt(), r.getCompletedAt(),
                findings.stream().map(FindingDto::from).toList()
        );
    }
}
