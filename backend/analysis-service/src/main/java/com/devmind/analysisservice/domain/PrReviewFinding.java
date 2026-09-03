package com.devmind.analysisservice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pr_review_findings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrReviewFinding {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "review_id", nullable = false, columnDefinition = "CHAR(36)")
    private String reviewId;

    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FindingSeverity severity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "line_number")
    private Integer lineNumber;

    @Column(nullable = false)
    private boolean grounded;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static PrReviewFinding of(String reviewId, String filePath, FindingSeverity severity,
                                      String message, Integer lineNumber, boolean grounded) {
        PrReviewFinding finding = new PrReviewFinding();
        finding.id = UUID.randomUUID().toString();
        finding.reviewId = reviewId;
        finding.filePath = filePath;
        finding.severity = severity;
        finding.message = message;
        finding.lineNumber = lineNumber;
        finding.grounded = grounded;
        finding.createdAt = Instant.now();
        return finding;
    }
}
