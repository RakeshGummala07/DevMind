package com.devmind.repositoryservice.repository;

import com.devmind.repositoryservice.domain.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepositoryJpaRepository extends JpaRepository<Repository, String> {
    List<Repository> findByConnectedByUserId(String userId);
    Optional<Repository> findByGithubRepoId(Long githubRepoId);
    boolean existsByGithubRepoId(Long githubRepoId);
}
