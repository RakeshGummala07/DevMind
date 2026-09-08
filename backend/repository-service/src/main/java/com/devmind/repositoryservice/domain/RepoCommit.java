package com.devmind.repositoryservice.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "repo_commits")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RepoCommit {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "repository_id", nullable = false, columnDefinition = "CHAR(36)")
    private String repositoryId;

    @Column(nullable = false, length = 40)
    private String sha;

    @Column(name = "author_login")
    private String authorLogin; // nullable — commit email may not map to a GitHub account

    @Column(name = "author_name")
    private String authorName;

    @Column(length = 1024)
    private String message;

    @Column(name = "committed_at", nullable = false)
    private Instant committedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static RepoCommit of(String repositoryId, String sha, String authorLogin, String authorName, String message, Instant committedAt) {
        RepoCommit commit = new RepoCommit();
        commit.id = UUID.randomUUID().toString();
        commit.repositoryId = repositoryId;
        commit.sha = sha;
        commit.authorLogin = authorLogin;
        commit.authorName = authorName;
        commit.message = message;
        commit.committedAt = committedAt;
        commit.createdAt = Instant.now();
        return commit;
    }
}
