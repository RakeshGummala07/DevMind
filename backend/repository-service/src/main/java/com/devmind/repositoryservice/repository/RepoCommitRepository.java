package com.devmind.repositoryservice.repository;

import com.devmind.repositoryservice.domain.RepoCommit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface RepoCommitRepository extends JpaRepository<RepoCommit, String> {

    boolean existsByRepositoryIdAndSha(String repositoryId, String sha);

    List<RepoCommit> findByRepositoryIdAndCommittedAtAfterOrderByCommittedAtAsc(String repositoryId, Instant after);

    long countByRepositoryId(String repositoryId);
}
