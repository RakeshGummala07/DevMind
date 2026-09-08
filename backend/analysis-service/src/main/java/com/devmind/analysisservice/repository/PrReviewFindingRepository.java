package com.devmind.analysisservice.repository;

import com.devmind.analysisservice.domain.PrReviewFinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrReviewFindingRepository extends JpaRepository<PrReviewFinding, String> {

    List<PrReviewFinding> findByReviewIdOrderByCreatedAtAsc(String reviewId);

    List<PrReviewFinding> findByReviewIdIn(List<String> reviewIds);
}
