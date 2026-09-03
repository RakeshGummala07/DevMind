package com.devmind.analysisservice.web;

import com.devmind.analysisservice.domain.PrReview;
import com.devmind.analysisservice.domain.PrReviewFinding;
import com.devmind.analysisservice.dto.PrReviewDto;
import com.devmind.analysisservice.exception.AppException;
import com.devmind.analysisservice.repository.PrReviewFindingRepository;
import com.devmind.analysisservice.repository.PrReviewRepository;
import com.devmind.analysisservice.service.PrReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class PrReviewController {

    private final PrReviewService prReviewService;
    private final PrReviewRepository prReviewRepository;
    private final PrReviewFindingRepository findingRepository;

    public PrReviewController(
            PrReviewService prReviewService,
            PrReviewRepository prReviewRepository,
            PrReviewFindingRepository findingRepository
    ) {
        this.prReviewService = prReviewService;
        this.prReviewRepository = prReviewRepository;
        this.findingRepository = findingRepository;
    }

    @PostMapping("/repositories/{repositoryId}/pull-requests/{prNumber}/reviews")
    public ResponseEntity<ApiResponse<PrReviewDto>> triggerReview(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String repositoryId,
            @PathVariable int prNumber
    ) {
        PrReview review = prReviewService.createPendingReview(repositoryId, prNumber, userId);
        prReviewService.runReviewAsync(review.getId());

        PrReviewDto dto = PrReviewDto.from(review, List.of());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(dto, "Review started"));
    }

    @GetMapping("/repositories/{repositoryId}/pull-requests/{prNumber}/reviews/latest")
    public ResponseEntity<ApiResponse<PrReviewDto>> getLatestReview(
            @PathVariable String repositoryId,
            @PathVariable int prNumber
    ) {
        PrReview review = prReviewRepository
                .findFirstByRepositoryIdAndPrNumberOrderByCreatedAtDesc(repositoryId, prNumber)
                .orElseThrow(() -> AppException.notFound("REVIEW_NOT_FOUND",
                        "No review found for PR #" + prNumber + " on this repository"));

        return ResponseEntity.ok(ApiResponse.ok(toDto(review)));
    }

    @GetMapping("/repositories/{repositoryId}/reviews")
    public ResponseEntity<ApiResponse<List<PrReviewDto>>> getReviewHistory(@PathVariable String repositoryId) {
        List<PrReview> reviews = prReviewRepository.findByRepositoryIdOrderByCreatedAtDesc(repositoryId);
        List<PrReviewDto> dtos = reviews.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @GetMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<PrReviewDto>> getReview(@PathVariable String reviewId) {
        PrReview review = prReviewRepository.findById(reviewId)
                .orElseThrow(() -> AppException.notFound("REVIEW_NOT_FOUND", "Review " + reviewId + " was not found"));
        return ResponseEntity.ok(ApiResponse.ok(toDto(review)));
    }

    private PrReviewDto toDto(PrReview review) {
        List<PrReviewFinding> findings = findingRepository.findByReviewIdOrderByCreatedAtAsc(review.getId());
        return PrReviewDto.from(review, findings);
    }
}
