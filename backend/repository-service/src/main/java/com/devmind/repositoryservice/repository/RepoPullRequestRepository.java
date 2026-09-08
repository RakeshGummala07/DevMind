package com.devmind.repositoryservice.repository;

import com.devmind.repositoryservice.domain.RepoPullRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepoPullRequestRepository extends JpaRepository<RepoPullRequest, String> {

    Optional<RepoPullRequest> findByRepositoryIdAndPrNumber(String repositoryId, int prNumber);

    List<RepoPullRequest> findByRepositoryIdOrderByOpenedAtDesc(String repositoryId);
}
