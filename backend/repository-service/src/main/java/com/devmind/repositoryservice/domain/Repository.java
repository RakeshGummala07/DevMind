package com.devmind.repositoryservice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Repository {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "github_repo_id", nullable = false, unique = true)
    private Long githubRepoId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String owner;

    @Column(length = 1024)
    private String description;

    @Column(name = "html_url", nullable = false)
    private String htmlUrl;

    @Column(name = "default_branch", nullable = false)
    private String defaultBranch;

    @Column(name = "primary_language")
    private String primaryLanguage;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @Column(name = "connected_by_user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String connectedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "indexing_status", nullable = false, length = 32)
    private IndexingStatus indexingStatus = IndexingStatus.IDLE;

    @Column(name = "stars_count", nullable = false)
    private int starsCount;

    @Column(name = "forks_count", nullable = false)
    private int forksCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Repository connect(
            Long githubRepoId, String fullName, String name, String owner, String description,
            String htmlUrl, String defaultBranch, String primaryLanguage, boolean isPrivate,
            int starsCount, int forksCount, String connectedByUserId
    ) {
        Repository repo = new Repository();
        repo.id = UUID.randomUUID().toString();
        repo.githubRepoId = githubRepoId;
        repo.fullName = fullName;
        repo.name = name;
        repo.owner = owner;
        repo.description = description;
        repo.htmlUrl = htmlUrl;
        repo.defaultBranch = defaultBranch;
        repo.primaryLanguage = primaryLanguage;
        repo.isPrivate = isPrivate;
        repo.starsCount = starsCount;
        repo.forksCount = forksCount;
        repo.connectedByUserId = connectedByUserId;
        repo.indexingStatus = IndexingStatus.IDLE;
        Instant now = Instant.now();
        repo.createdAt = now;
        repo.updatedAt = now;
        return repo;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
