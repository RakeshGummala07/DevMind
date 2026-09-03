package com.devmind.analysisservice.repository;

import com.devmind.analysisservice.domain.PrReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrReviewRepository extends JpaRepository<PrReview, String> {

    Optional<PrReview> findFirstByRepositoryIdAndPrNumberOrderByCreatedAtDesc(String repositoryId, int prNumber);

    List<PrReview> findByRepositoryIdOrderByCreatedAtDesc(String repositoryId);
}
